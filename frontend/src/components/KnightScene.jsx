import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const GOLD = 0xc9a84c;
const CRIMSON = 0x8a2826;

const MODEL_URL = `${import.meta.env.BASE_URL}rogue_legacy_knight.glb`;

function disposeObject3D(obj) {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.geometry?.dispose();
      const m = child.material;
      if (Array.isArray(m)) m.forEach((mat) => mat.dispose?.());
      else m?.dispose?.();
    }
  });
}

/**
 * GLB model (rogue_legacy_knight.glb). Rim gold / crimson fill; dust; Y-spin on hover.
 */
export function KnightScene({
  variant = "hero",
  scrollProgress = 0,
  ctaHover = false,
  className,
  style,
}) {
  const containerRef = useRef(null);
  const scrollRef = useRef(scrollProgress);
  const hoverRef = useRef(ctaHover);
  const variantRef = useRef(variant);

  scrollRef.current = scrollProgress;
  hoverRef.current = ctaHover;
  variantRef.current = variant;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.clientWidth || 400;
    const h = el.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0.35, 3.2);
    camera.lookAt(0, 0.15, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const pivot = new THREE.Group();
    scene.add(pivot);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.ShadowMaterial({ opacity: 0.32 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.85;
    ground.receiveShadow = true;
    scene.add(ground);

    const keyGold = new THREE.DirectionalLight(GOLD, 2.0);
    keyGold.position.set(-3.5, 5, 2);
    keyGold.castShadow = true;
    keyGold.shadow.mapSize.set(1024, 1024);
    scene.add(keyGold);

    const fillRed = new THREE.DirectionalLight(CRIMSON, 0.75);
    fillRed.position.set(3.5, 1.5, 2.5);
    scene.add(fillRed);

    const rim = new THREE.PointLight(GOLD, 0.5, 10);
    rim.position.set(-1.8, 2, 1.5);
    scene.add(rim);

    const ambient = new THREE.AmbientLight(0x4a4038, 0.45);
    scene.add(ambient);

    const dustCount = 220;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = Math.random() * 2.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: GOLD,
      size: 0.028,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    let loadedRoot = null;
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (cancelled) {
          disposeObject3D(gltf.scene);
          return;
        }
        const root = gltf.scene;
        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const target = 1.65;
        const s = target / maxDim;
        root.scale.setScalar(s);

        const box2 = new THREE.Box3().setFromObject(root);
        const center = new THREE.Vector3();
        box2.getCenter(center);
        root.position.sub(center);
        root.position.y += 0.05;

        pivot.add(root);
        loadedRoot = root;
      },
      undefined,
      (err) => {
        console.error("[KnightScene] Failed to load rogue_legacy_knight.glb", err);
      },
    );

    const clock = new THREE.Clock();
    let raf;

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const t = clock.elapsedTime;
      const sp = scrollRef.current;
      const hv = hoverRef.current;
      const vic = variantRef.current === "victory";

      const scrollYaw = sp * THREE.MathUtils.degToRad(28);
      const breath = Math.sin(t * 1.6) * 0.015;
      pivot.scale.setScalar(1 + breath);

      const spinSpeed = 2.8;
      if (loadedRoot && hv) {
        loadedRoot.rotation.y += delta * spinSpeed;
      }

      const targetYaw = vic ? -0.22 : scrollYaw;
      pivot.rotation.y = THREE.MathUtils.lerp(
        pivot.rotation.y,
        targetYaw,
        vic ? 0.08 : 0.12,
      );

      const posArr = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        posArr[i * 3 + 1] += 0.003 + Math.random() * 0.001;
        if (posArr[i * 3 + 1] > 2.8) {
          posArr[i * 3 + 1] = 0;
          posArr[i * 3] = (Math.random() - 0.5) * 3;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw < 10 || ch < 10) return;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (loadedRoot) {
        pivot.remove(loadedRoot);
        disposeObject3D(loadedRoot);
      }
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 280,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
