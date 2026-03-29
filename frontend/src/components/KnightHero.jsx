import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mats = obj.material;
    if (!mats) return;
    const list = Array.isArray(mats) ? mats : [mats];
    list.forEach((m) => m.dispose?.());
  });
}

export default function KnightHero() {
  const mountRef = useRef(null);
  const mouseXRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let frameId = 0;

    const onMouseMove = (e) => {
      const w = window.innerWidth || 1;
      mouseXRef.current = (e.clientX / w) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      38,
      mount.clientWidth / mount.clientHeight || 1,
      0.1,
      100,
    );
    camera.position.set(0, 2.2, 9.5);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x1a1208, 0.3);
    scene.add(ambient);

    const goldSpot = new THREE.SpotLight(
      0xc9a84c,
      12,
      18,
      Math.PI / 5,
      0.5,
      2,
    );
    goldSpot.position.set(0, 7, 3);
    goldSpot.castShadow = false;
    goldSpot.target.position.set(0, 1, 0);
    scene.add(goldSpot.target);
    scene.add(goldSpot);

    const crimsonSpot = new THREE.SpotLight(
      0xb8312f,
      4,
      18,
      Math.PI / 7,
      0.7,
      2,
    );
    crimsonSpot.position.set(4, 3, 2);
    crimsonSpot.castShadow = false;
    crimsonSpot.target.position.set(0, 1, 0);
    scene.add(crimsonSpot.target);
    scene.add(crimsonSpot);

    const poolMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.01, 0);
    scene.add(pool);

    const particleCount = 150;
    const particlePositions = new Float32Array(particleCount * 3);
    const spawnBase = () => {
      const r = Math.random() * 0.5;
      const a = Math.random() * Math.PI * 2;
      return {
        x: Math.cos(a) * r,
        y: Math.random() * 0.35,
        z: Math.sin(a) * r,
      };
    };
    for (let i = 0; i < particleCount; i++) {
      const p = spawnBase();
      particlePositions[i * 3] = p.x;
      particlePositions[i * 3 + 1] = p.y;
      particlePositions[i * 3 + 2] = p.z;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0xc9a84c,
      size: 0.018,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const loader = new GLTFLoader();
    let knight = null;
    let mixer = null;

    loader.load(
      "/models/knight.glb",
      (gltf) => {
        if (cancelled) {
          disposeObject3D(gltf.scene);
          return;
        }
        knight = gltf.scene;
        knight.position.set(0, 0, 0);
        knight.scale.set(1.4, 1.4, 1.4);
        knight.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = false;
          }
        });
        scene.add(knight);

        mixer = new THREE.AnimationMixer(knight);
        const forwardClip = gltf.animations.find((a) => a.name === "Forward");
        if (forwardClip) {
          const action = mixer.clipAction(forwardClip);
          action.loop = THREE.LoopRepeat;
          action.timeScale = 0.55;
          action.play();
        }
      },
      undefined,
      (err) => {
        if (!cancelled) console.error("[KnightHero] GLTF load error:", err);
      },
    );

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let lastSec = performance.now() / 1000;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const nowSec = performance.now() / 1000;
      const delta = nowSec - lastSec;
      lastSec = nowSec;
      time += delta;

      goldSpot.position.x = Math.sin(time * 0.25) * 1.2;

      if (mixer) mixer.update(delta);

      if (knight) {
        knight.position.y = Math.abs(Math.sin(time * 2.8)) * 0.04;
        knight.rotation.y += 0.007;
        const targetRotY = mouseXRef.current * 0.45;
        knight.rotation.y += (targetRotY - knight.rotation.y) * 0.03;
      }

      const posAttr = particleGeo.getAttribute("position");
      const arr = posAttr.array;
      for (let i = 0; i < particleCount; i++) {
        const iy = i * 3 + 1;
        arr[iy] += delta * 0.35;
        if (arr[iy] > 3) {
          const p = spawnBase();
          arr[i * 3] = p.x;
          arr[iy] = p.y;
          arr[i * 3 + 2] = p.z;
        }
      }
      posAttr.needsUpdate = true;

      camera.lookAt(0, 1.5, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (knight) {
        disposeObject3D(knight);
        scene.remove(knight);
      }
      if (mixer) mixer.stopAllAction();
      mixer = null;
      scene.remove(goldSpot.target);
      scene.remove(goldSpot);
      goldSpot.dispose();
      scene.remove(crimsonSpot.target);
      scene.remove(crimsonSpot);
      crimsonSpot.dispose();
      scene.remove(pool);
      pool.geometry.dispose();
      poolMat.dispose();
      scene.remove(particles);
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
