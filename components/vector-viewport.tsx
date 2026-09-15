"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Annotation, CLASSES, positionAt } from "@/lib/vector-model";

export type ViewportProps = {
  annotations: Annotation[];
  selected: string[];
  frame: number;
  seed: number;
  tool: "select" | "move" | "box";
  view: "perspective" | "top" | "front";
  layers: {
    points: boolean;
    boxes: boolean;
    mesh: boolean;
    tracks: boolean;
    grid: boolean;
  };
  pointSize: number;
  resetKey: number;
  onSelect: (ids: string[]) => void;
  onMove: (id: string, x: number, z: number) => void;
  onStats: (points: number, fps: number) => void;
};
type ObjectEntry = {
  group: THREE.Group;
  box: THREE.LineSegments;
  mesh: THREE.Mesh;
  cloud: THREE.Points;
  label: HTMLDivElement;
  a: Annotation;
};
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function dispose(root: THREE.Object3D) {
  root.traverse((o) => {
    const item = o as THREE.Mesh;
    item.geometry?.dispose();
    if (item.material)
      (Array.isArray(item.material) ? item.material : [item.material]).forEach(
        (m) => m.dispose(),
      );
  });
}

export default function VectorViewport(props: ViewportProps) {
  const container = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  const engine = useRef<{ sync: () => void; camera: () => void } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    current.current = props;
  });
  useEffect(() => {
    const host = container.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
    } catch {
      // Renderer construction synchronizes an external WebGL capability with the fallback UI.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(
        "此裝置無法啟動 WebGL。請使用支援硬體加速的瀏覽器；物件清單、屬性編輯與匯出仍可使用。",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor("#0c1117");
    renderer.domElement.setAttribute(
      "aria-label",
      "可旋轉與選取物件的 3D 點雲場景",
    );
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("data-testid", "point-cloud");
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#0c1117", 0.009);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 250);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minDistance = 7;
    controls.maxDistance = 110;
    controls.maxPolarAngle = Math.PI / 2.04;
    const resetCamera = () => {
      const v = current.current.view;
      camera.position.set(
        ...((v === "top"
          ? [0, 66, 0.01]
          : v === "front"
            ? [0, 5, 43]
            : [34, 31, 42]) as [number, number, number]),
      );
      controls.target.set(0, 0, 0);
      camera.lookAt(controls.target);
      controls.update();
    };
    resetCamera();
    const grid = new THREE.GridHelper(130, 65, "#34464d", "#1a272e");
    grid.position.y = -0.08;
    scene.add(grid);
    const pointsPositions: number[] = [];
    const colors: number[] = [];
    const rnd = random(current.current.seed);
    const addPoint = (
      x: number,
      y: number,
      z: number,
      color: THREE.Color,
      brightness = 1,
    ) => {
      pointsPositions.push(x, y, z);
      colors.push(
        color.r * brightness,
        color.g * brightness,
        color.b * brightness,
      );
    };
    const groundColor = new THREE.Color("#506775");
    const wallColor = new THREE.Color("#57727c");
    const treeColor = new THREE.Color("#76a597");
    // Deterministic synthetic LiDAR-like surfaces; no network dataset or pretrained model.
    for (let x = -43; x < 43; x += 0.43)
      for (let z = -48; z < 48; z += 0.43) {
        if (rnd() > 0.58)
          addPoint(
            x + rnd() * 0.18,
            rnd() * 0.05,
            z + rnd() * 0.18,
            groundColor,
            0.3 + rnd() * 0.65,
          );
      }
    const cityMeshes = new THREE.Group();
    scene.add(cityMeshes);
    for (const side of [-1, 1])
      for (let j = 0; j < 7; j++) {
        const x = side * (18 + rnd() * 4),
          z = -39 + j * 13,
          w = 8 + rnd() * 6,
          d = 8 + rnd() * 3,
          h = 6 + rnd() * 13;
        for (let y = 0.3; y < h; y += 0.4)
          for (let u = -w / 2; u < w / 2; u += 0.36) {
            if (rnd() > 0.24) {
              addPoint(x + u, y, z - d / 2, wallColor, 0.45 + rnd() * 0.5);
              addPoint(x + u, y, z + d / 2, wallColor, 0.45 + rnd() * 0.5);
            }
          }
        for (let y = 0.3; y < h; y += 0.4)
          for (let u = -d / 2; u < d / 2; u += 0.36)
            if (rnd() > 0.24)
              addPoint(
                x - (side * w) / 2,
                y,
                z + u,
                wallColor,
                0.55 + rnd() * 0.5,
              );
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshBasicMaterial({
            color: "#21323a",
            transparent: true,
            opacity: 0.24,
          }),
        );
        building.position.set(x, h / 2, z);
        cityMeshes.add(building);
        const tx = side * 11.5,
          tz = z + 3;
        for (let k = 0; k < 650; k++) {
          const angle = rnd() * Math.PI * 2,
            cos = rnd() * 2 - 1,
            r = 1.7 + rnd() * 0.7;
          addPoint(
            tx + r * Math.sqrt(1 - cos * cos) * Math.cos(angle),
            4 + r * cos,
            tz + r * Math.sqrt(1 - cos * cos) * Math.sin(angle),
            treeColor,
            0.5 + rnd() * 0.5,
          );
        }
        for (let y = 0; y < 3; y += 0.1)
          for (let i = 0; i < 5; i++)
            addPoint(tx + rnd() * 0.25, y, tz + rnd() * 0.25, wallColor);
      }
    const road = new THREE.Group();
    scene.add(road);
    for (const x of [-8.5, 0, 8.5]) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0.06, -52),
          new THREE.Vector3(x, 0.06, 52),
        ]),
        new THREE.LineDashedMaterial({
          color: x === 0 ? "#64795a" : "#42616b",
          dashSize: x === 0 ? 2 : 100,
          gapSize: 2,
          transparent: true,
          opacity: 0.65,
        }),
      );
      line.computeLineDistances();
      road.add(line);
    }
    // Crosswalk points make the geometry legible at a glance.
    for (let z = -6; z < 3; z += 1.25)
      for (let x = -8; x < 8; x += 0.18)
        for (let dz = 0; dz < 0.5; dz += 0.18)
          addPoint(x, 0.09, z + dz, new THREE.Color("#93a2a7"), 0.6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pointsPositions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const pointMaterial = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      sizeAttenuation: true,
    });
    const cloud = new THREE.Points(geometry, pointMaterial);
    scene.add(cloud);
    const ego = new THREE.Group();
    const egoBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 1.3, 4.1),
      new THREE.MeshBasicMaterial({
        color: "#dce6eb",
        transparent: true,
        opacity: 0.16,
      }),
    );
    egoBody.position.y = 0.65;
    ego.add(egoBody);
    const egoWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(egoBody.geometry),
      new THREE.LineBasicMaterial({ color: "#a9c0cd" }),
    );
    egoWire.position.y = 0.65;
    ego.add(egoWire);
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0.1, -2.4),
      3,
      "#a9c0cd",
      0.7,
      0.7,
    );
    ego.add(arrow);
    ego.position.z = 20;
    scene.add(ego);
    const labels = document.createElement("div");
    labels.className = "vx-world-labels";
    host.appendChild(labels);
    const objects = new THREE.Group();
    scene.add(objects);
    const trajectories = new THREE.Group();
    scene.add(trajectories);
    let entries: ObjectEntry[] = [];
    const sync = () => {
      dispose(objects);
      objects.clear();
      dispose(trajectories);
      trajectories.clear();
      labels.replaceChildren();
      entries = [];
      for (const a of current.current.annotations) {
        const color = CLASSES[a.category].color;
        const group = new THREE.Group();
        const shape = new THREE.BoxGeometry(a.width, a.height, a.length);
        const mesh = new THREE.Mesh(
          shape,
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
          }),
        );
        mesh.userData.id = a.id;
        const box = new THREE.LineSegments(
          new THREE.EdgesGeometry(shape),
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.75,
          }),
        );
        const pts: number[] = [];
        const r = random(a.id.charCodeAt(0) + Number(a.id.slice(-3)));
        for (let i = 0; i < (a.category === "vehicle" ? 1100 : 300); i++) {
          const v = [r() - 0.5, r() - 0.5, r() - 0.5];
          v[Math.floor(r() * 3)] = r() > 0.5 ? 0.5 : -0.5;
          if (a.category === "vehicle" && v[1] > 0.15) {
            v[0] *= 0.8;
            v[2] *= 0.6;
          }
          pts.push(
            v[0] * a.width * 0.94,
            v[1] * a.height * 0.94,
            v[2] * a.length * 0.94,
          );
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        const objectCloud = new THREE.Points(
          geo,
          new THREE.PointsMaterial({
            color,
            size: 0.067,
            transparent: true,
            opacity: 0.8,
          }),
        );
        group.add(mesh, box, objectCloud);
        group.rotation.y = (a.rotation * Math.PI) / 180;
        objects.add(group);
        const label = document.createElement("div");
        label.className = "vx-world-label";
        label.style.setProperty("--object-color", color);
        label.textContent = a.id;
        labels.appendChild(label);
        entries.push({ group, box, mesh, cloud: objectCloud, label, a });
        const trackPoints = [0, 30, 60, 90, 119].map((f) => {
          const p = positionAt(a, f);
          return new THREE.Vector3(p.x, 0.12, p.z);
        });
        const track = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(trackPoints),
          new THREE.LineDashedMaterial({
            color,
            dashSize: 0.4,
            gapSize: 0.3,
            transparent: true,
            opacity: 0.6,
          }),
        );
        track.computeLineDistances();
        trajectories.add(track);
      }
    };
    sync();
    engine.current = { sync, camera: resetCamera };
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ground = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      return ray.ray.intersectPlane(plane, new THREE.Vector3());
    };
    let drag: {
      startX: number;
      startY: number;
      ground: THREE.Vector3 | null;
      entry?: ObjectEntry;
      origin?: THREE.Vector3;
    } | null = null;
    const marquee = document.createElement("div");
    marquee.className = "vx-marquee";
    marquee.hidden = true;
    host.appendChild(marquee);
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const p = ground(event);
      const hit = ray.intersectObjects(entries.map((e) => e.mesh))[0];
      const entry = hit
        ? entries.find((e) => e.a.id === hit.object.userData.id)
        : undefined;
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        ground: p,
        entry,
        origin: entry?.group.position.clone(),
      };
      if (
        current.current.tool === "box" ||
        (current.current.tool === "move" && entry)
      ) {
        controls.enabled = false;
        renderer.domElement.setPointerCapture(event.pointerId);
      }
    };
    const move = (event: PointerEvent) => {
      if (!drag) return;
      if (
        current.current.tool === "move" &&
        drag.entry &&
        drag.ground &&
        drag.origin
      ) {
        const p = ground(event);
        if (p)
          drag.entry.group.position.copy(drag.origin).add(p.sub(drag.ground));
      }
      if (current.current.tool === "box") {
        const rect = host.getBoundingClientRect();
        marquee.hidden = false;
        Object.assign(marquee.style, {
          left: `${Math.min(event.clientX, drag.startX) - rect.left}px`,
          top: `${Math.min(event.clientY, drag.startY) - rect.top}px`,
          width: `${Math.abs(event.clientX - drag.startX)}px`,
          height: `${Math.abs(event.clientY - drag.startY)}px`,
        });
      }
    };
    const up = (event: PointerEvent) => {
      if (!drag) return;
      const state = current.current,
        moved =
          Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >
          5;
      if (state.tool === "box" && moved) {
        const rect = host.getBoundingClientRect();
        state.onSelect(
          entries
            .filter((e) => {
              const p = e.group.position.clone().project(camera);
              const x = ((p.x + 1) / 2) * rect.width + rect.left,
                y = ((-p.y + 1) / 2) * rect.height + rect.top;
              return (
                p.z < 1 &&
                x >= Math.min(drag!.startX, event.clientX) &&
                x <= Math.max(drag!.startX, event.clientX) &&
                y >= Math.min(drag!.startY, event.clientY) &&
                y <= Math.max(drag!.startY, event.clientY)
              );
            })
            .map((e) => e.a.id),
        );
      } else if (state.tool === "move" && drag.entry && drag.origin && moved) {
        state.onSelect([drag.entry.a.id]);
        state.onMove(
          drag.entry.a.id,
          Math.round(
            (drag.entry.a.x + drag.entry.group.position.x - drag.origin.x) *
              100,
          ) / 100,
          Math.round(
            (drag.entry.a.z + drag.entry.group.position.z - drag.origin.z) *
              100,
          ) / 100,
        );
      } else if (!moved && drag.entry) {
        const id = drag.entry.a.id;
        state.onSelect(
          event.shiftKey
            ? state.selected.includes(id)
              ? state.selected.filter((v) => v !== id)
              : [...state.selected, id]
            : [id],
        );
      } else if (!moved) state.onSelect([]);
      drag = null;
      controls.enabled = true;
      marquee.hidden = true;
      if (renderer.domElement.hasPointerCapture(event.pointerId))
        renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const cancel = () => {
      drag = null;
      controls.enabled = true;
      marquee.hidden = true;
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    const lost = (event: Event) => {
      event.preventDefault();
      setError(
        "3D 顯示暫停，WebGL 連線已中斷。重新整理可恢復；已保存的標註會保留。",
      );
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const resize = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(host);
    let raf = 0,
      last = performance.now(),
      frames = 0;
    const render = () => {
      const s = current.current;
      controls.update();
      grid.visible = s.layers.grid;
      road.visible = s.layers.grid;
      cloud.visible = s.layers.points;
      cityMeshes.visible = s.layers.mesh;
      trajectories.visible = s.layers.tracks;
      pointMaterial.size = s.pointSize * 0.043;
      const w = host.clientWidth,
        h = host.clientHeight;
      entries.forEach((e) => {
        if (drag?.entry !== e || s.tool !== "move") {
          const p = positionAt(e.a, s.frame);
          e.group.position.set(p.x, p.y, p.z);
        }
        const selected = s.selected.includes(e.a.id);
        (e.box.material as THREE.LineBasicMaterial).opacity = selected
          ? 1
          : 0.65;
        (e.mesh.material as THREE.MeshBasicMaterial).opacity = s.layers.mesh
          ? selected
            ? 0.25
            : 0.13
          : 0;
        e.box.visible = s.layers.boxes;
        e.cloud.visible = s.layers.points;
        const v = e.group.position.clone();
        v.y += e.a.height / 2 + 0.6;
        v.project(camera);
        e.label.style.display =
          s.layers.boxes && v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1
            ? ""
            : "none";
        e.label.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((-v.y + 1) / 2) * h}px) translate(-50%, -100%)`;
        e.label.classList.toggle("selected", selected);
      });
      renderer.render(scene, camera);
      frames++;
      const now = performance.now();
      if (now - last > 1200) {
        s.onStats(
          pointsPositions.length / 3 +
            entries.reduce(
              (n, e) => n + e.cloud.geometry.attributes.position.count,
              0,
            ),
          Math.round((frames * 1000) / (now - last)),
        );
        last = now;
        frames = 0;
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      controls.dispose();
      dispose(scene);
      renderer.dispose();
      renderer.domElement.remove();
      labels.remove();
      marquee.remove();
      engine.current = null;
    };
  }, [props.seed]);
  useEffect(() => {
    engine.current?.sync();
  }, [props.annotations]);
  useEffect(() => {
    engine.current?.camera();
  }, [props.view, props.resetKey]);
  return (
    <div className={`vx-canvas-host vx-tool-${props.tool}`} ref={container}>
      {error && (
        <div role="alert" className="vx-webgl-error">
          {error}
        </div>
      )}
    </div>
  );
}
