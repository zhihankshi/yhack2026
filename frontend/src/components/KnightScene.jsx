import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function upgradeMeshMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    const proc = (m) => {
      if (!m) return m;
      if (m.isMeshBasicMaterial || m.isMeshLambertMaterial) {
        const nm = new THREE.MeshStandardMaterial({
          color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
          map: m.map ?? null,
          roughness: 0.8,
          metalness: 0.1,
        });
        if (m.normalMap) nm.normalMap = m.normalMap;
        if (m.aoMap) nm.aoMap = m.aoMap;
        if (m.emissiveMap) nm.emissiveMap = m.emissiveMap;
        if (m.emissive) nm.emissive.copy(m.emissive);
        if (m.alphaMap) nm.alphaMap = m.alphaMap;
        if (m.transparent !== undefined) nm.transparent = m.transparent;
        if (m.opacity !== undefined) nm.opacity = m.opacity;
        if (m.side !== undefined) nm.side = m.side;
        m.dispose?.();
        return nm;
      }
      return m;
    };

    if (Array.isArray(child.material)) {
      child.material = child.material.map(proc);
    } else {
      child.material = proc(child.material);
    }
  });
}

export default function KnightScene({
  isGenerating,
  crimeLevel,
  currentPhase,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e0c08, 0.1);

    const w = canvas.offsetWidth || 1;
    const h = canvas.offsetHeight || 1;
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 2.2, 8.5);
    camera.lookAt(0, 1.4, 0);

    const goldDir = new THREE.DirectionalLight(0xc9a84c, 0.8);
    goldDir.position.set(-3, 5, 2);
    goldDir.castShadow = true;
    scene.add(goldDir);

    const crimsonPt = new THREE.PointLight(0xb8312f, 2.5, 12);
    crimsonPt.position.set(3, 2, 1);
    scene.add(crimsonPt);

    const lanternLight = new THREE.PointLight(0xffb347, 1.6, 10);
    lanternLight.position.set(-2.8, 2.5, -1.5);
    scene.add(lanternLight);

    const moonPt = new THREE.PointLight(0x6688aa, 0.8, 15);
    moonPt.position.set(3.5, 4, -3.5);
    scene.add(moonPt);

    const ambient = new THREE.AmbientLight(0x1a1208, 0.8);
    scene.add(ambient);

    const spotLight = new THREE.SpotLight(
      0xc9a84c,
      6,
      20,
      Math.PI / 5,
      0.4,
      2,
    );
    spotLight.position.set(0, 8, 4);
    spotLight.castShadow = true;
    spotLight.target.position.set(0, 1, 0);
    scene.add(spotLight.target);
    scene.add(spotLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x2a2010,
        roughness: 0.9,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    let knightModel = null;
    let mixer = null;
    let stallGroup = null;
    let windmillGroup = null;
    let windmillMesh = null;
    let stallMesh = null;

    let mouseX = 0;
    let mouseY = 0;
    let animFrameId = 0;

    const loader = new GLTFLoader();

    loader.load(
      "/models/knight.glb",
      (gltf) => {
        console.log(
          "[Knight] loaded, clips:",
          gltf.animations.map((a) => a.name),
        );
        knightModel = gltf.scene;
        knightModel.position.set(-0.5, 0, 0);
        knightModel.scale.set(1.2, 1.2, 1.2);
        knightModel.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        mixer = new THREE.AnimationMixer(knightModel);
        const actionClip = gltf.animations.find((a) => a.name === "Action");
        if (actionClip) {
          const action = mixer.clipAction(actionClip);
          action.loop = THREE.LoopRepeat;
          action.play();
        }
        scene.add(knightModel);
      },
      undefined,
      (e) => console.log("[Knight] error:", e),
    );

    loader.load(
      "/models/market_stall.glb",
      (gltf) => {
        console.log("[Stall] loaded");
        stallGroup = gltf.scene;
        stallGroup.position.set(-2.8, 0, -2.5);
        stallGroup.scale.set(0.8, 0.8, 0.8);
        upgradeMeshMaterials(stallGroup);
        stallGroup.traverse((c) => {
          if (c.isMesh && c.name === "Cylinder054_Medieval_0") {
            stallMesh = c;
          }
        });
        scene.add(stallGroup);
      },
      undefined,
      (e) => console.log("[Stall] error:", e),
    );

    loader.load(
      "/models/windmill.glb",
      (gltf) => {
        console.log("[Windmill] loaded");
        windmillGroup = gltf.scene;
        windmillGroup.position.set(3.5, 0, -3.5);
        windmillGroup.scale.set(0.7, 0.7, 0.7);
        upgradeMeshMaterials(windmillGroup);
        windmillGroup.traverse((c) => {
          if (c.isMesh && c.name === "Windmill_Medieval_0") {
            windmillMesh = c;
          }
        });
        scene.add(windmillGroup);
      },
      undefined,
      (e) => console.log("[Windmill] error:", e),
    );

    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      const cw = canvasRef.current?.offsetWidth ?? 1;
      const ch = canvasRef.current?.offsetHeight ?? 1;
      renderer.setSize(cw, ch);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const clock = { last: performance.now() };
    function animate() {
      animFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - clock.last) / 1000;
      clock.last = now;
      const time = now / 1000;

      if (mixer) mixer.update(delta);

      if (knightModel) {
        knightModel.position.y = Math.sin(time * 1.4) * 0.012;
        knightModel.rotation.y +=
          (window.scrollY / window.innerHeight) * 0.01;
        camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.03;
        camera.position.y +=
          (-mouseY * 0.15 + 2.2 - camera.position.y) * 0.03;
      }

      if (windmillMesh) windmillMesh.rotation.z += 0.003;
      if (windmillGroup)
        windmillGroup.rotation.z = Math.sin(time * 0.4) * 0.008;
      if (stallMesh) stallMesh.rotation.z = Math.sin(time * 1.2) * 0.012;

      if (lanternLight)
        lanternLight.intensity =
          1.6 + Math.sin(time * 5.5) * 0.3 + Math.sin(time * 13) * 0.08;
      if (spotLight) spotLight.position.x = Math.sin(time * 0.3) * 0.8;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
