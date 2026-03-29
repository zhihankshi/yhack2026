import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FABRIC_RE = /fabric|cloth|awning|banner|flag|top|cover/i;

function collectMeshNames(root) {
  const names = [];
  root.traverse((c) => {
    if (c.isMesh) names.push(c.name || "(unnamed)");
  });
  return names;
}

function upgradeMaterials(root) {
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

function findFabricMesh(root) {
  let found = null;
  root.traverse((c) => {
    if (found || !c.isMesh) return;
    const n = c.name || "";
    if (FABRIC_RE.test(n)) found = c;
  });
  return found;
}

function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mats = obj.material;
    if (!mats) return;
    const list = Array.isArray(mats) ? mats : [mats];
    list.forEach((m) => m.dispose?.());
  });
}

export default function KnightScene({
  isGenerating = false,
  crimeLevel = "minor",
  currentPhase = "",
}) {
  const mountRef = useRef(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const crimeLevelRef = useRef(crimeLevel);

  const mixerRef = useRef(null);
  const actionClipRef = useRef(null);
  const forwardClipRef = useRef(null);
  const backwardClipRef = useRef(null);
  const deathClipRef = useRef(null);
  const jumpClipRef = useRef(null);
  const strafeClipRef = useRef(null);
  const tPoseClipRef = useRef(null);
  const takeHitClipRef = useRef(null);
  const victoryClipRef = useRef(null);
  const currentActionRef = useRef(null);

  const victoryTimeoutRef = useRef(null);
  const severeTimeoutRef = useRef(null);
  const prevIsGeneratingRef = useRef(isGenerating);
  const prevCrimeLevelRef = useRef(crimeLevel);
  const isGeneratingRef = useRef(isGenerating);

  const [knightLoaded, setKnightLoaded] = useState(false);

  useEffect(() => {
    crimeLevelRef.current = crimeLevel;
  }, [crimeLevel]);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const clearVictoryTimeout = () => {
    if (victoryTimeoutRef.current) {
      clearTimeout(victoryTimeoutRef.current);
      victoryTimeoutRef.current = null;
    }
  };

  const clearSevereTimeout = () => {
    if (severeTimeoutRef.current) {
      clearTimeout(severeTimeoutRef.current);
      severeTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!knightLoaded) return;

    const forwardAction = forwardClipRef.current;
    const actionAction = actionClipRef.current;
    const victoryAction = victoryClipRef.current;

    if (isGenerating) {
      clearVictoryTimeout();
      const cur = currentActionRef.current;
      if (forwardAction) {
        forwardAction.timeScale = 1.0;
        if (cur && cur !== forwardAction) {
          cur.crossFadeTo(forwardAction, 0.5, true);
          currentActionRef.current = forwardAction;
        }
      }
    } else if (prevIsGeneratingRef.current === true) {
      clearVictoryTimeout();
      const cur = currentActionRef.current;
      if (cur && victoryAction && actionAction) {
        victoryAction.setLoop(THREE.LoopOnce, 1);
        victoryAction.clampWhenFinished = true;
        victoryAction.reset();
        cur.crossFadeTo(victoryAction, 0.4, true);
        currentActionRef.current = victoryAction;
        victoryTimeoutRef.current = setTimeout(() => {
          const c = currentActionRef.current;
          const v = victoryClipRef.current;
          const act = actionClipRef.current;
          if (c && v && act && c === v) {
            const cr = crimeLevelRef.current;
            act.timeScale = cr === "moderate" ? 0.56 : 0.8;
            c.crossFadeTo(act, 0.8, true);
            currentActionRef.current = act;
          }
          victoryTimeoutRef.current = null;
        }, 3000);
      }
    }

    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating, knightLoaded]);

  useEffect(() => {
    if (!knightLoaded) return;

    const actionAction = actionClipRef.current;
    if (
      actionAction &&
      currentActionRef.current === actionAction &&
      !isGenerating
    ) {
      if (crimeLevel === "moderate") actionAction.timeScale = 0.56;
      else if (crimeLevel === "minor") actionAction.timeScale = 0.8;
    }

    if (crimeLevel === "severe" && prevCrimeLevelRef.current !== "severe") {
      clearSevereTimeout();
      const cur = currentActionRef.current;
      const takeHit = takeHitClipRef.current;
      const act = actionClipRef.current;
      if (cur && takeHit && act) {
        takeHit.reset();
        takeHit.setLoop(THREE.LoopOnce, 1);
        takeHit.clampWhenFinished = true;
        cur.crossFadeTo(takeHit, 0.3, true);
        currentActionRef.current = takeHit;
        severeTimeoutRef.current = setTimeout(() => {
          const c = currentActionRef.current;
          const th = takeHitClipRef.current;
          const a = actionClipRef.current;
          if (c && th && a && c === th) {
            const cr = crimeLevelRef.current;
            a.timeScale = cr === "moderate" ? 0.56 : 0.8;
            c.crossFadeTo(a, 0.8, true);
            currentActionRef.current = a;
          }
          severeTimeoutRef.current = null;
        }, 1500);
      }
    }

    prevCrimeLevelRef.current = crimeLevel;
  }, [crimeLevel, knightLoaded, isGenerating]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let frameId = 0;

    const onMouseMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseXRef.current = (e.clientX / w) * 2 - 1;
      mouseYRef.current = -(e.clientY / h) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e0c08, 0.1);

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight || 1,
      0.1,
      200,
    );
    camera.position.set(0, 2.2, 8.5);
    camera.lookAt(0, 1.4, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const goldLight = new THREE.DirectionalLight(0xc9a84c, 0.8);
    goldLight.position.set(-3, 5, 2);
    goldLight.castShadow = true;
    goldLight.shadow.mapSize.set(2048, 2048);
    goldLight.shadow.camera.near = 0.5;
    goldLight.shadow.camera.far = 50;
    goldLight.shadow.camera.left = -12;
    goldLight.shadow.camera.right = 12;
    goldLight.shadow.camera.top = 12;
    goldLight.shadow.camera.bottom = -12;
    scene.add(goldLight);

    const spotLight = new THREE.SpotLight(
      0xc9a84c,
      8,
      20,
      Math.PI / 6,
      0.4,
      2,
    );
    spotLight.position.set(0, 8, 4);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.set(2048, 2048);
    spotLight.target.position.set(0, 1, 0);
    scene.add(spotLight.target);
    scene.add(spotLight);

    const spotLightCrimson = new THREE.SpotLight(
      0xb8312f,
      3,
      20,
      Math.PI / 8,
      0.6,
      2,
    );
    spotLightCrimson.position.set(4, 3, 2);
    spotLightCrimson.target.position.set(0, 1, 0);
    scene.add(spotLightCrimson.target);
    scene.add(spotLightCrimson);

    const crimsonLight = new THREE.PointLight(0xb8312f, 2.5, 40, 2);
    crimsonLight.position.set(3, 2, 1);
    scene.add(crimsonLight);

    const lanternLight = new THREE.PointLight(0xffb347, 1.6, 25, 2);
    lanternLight.position.set(-2.2, 2.5, -1.5);
    scene.add(lanternLight);

    const moonLight = new THREE.PointLight(0x6688aa, 0.8, 40, 2);
    moonLight.position.set(3.5, 4, -4);
    scene.add(moonLight);

    const ambient = new THREE.AmbientLight(0x1a1208, 0.4);
    scene.add(ambient);

    const texLoader = new THREE.TextureLoader();
    const floorColor = texLoader.load("/textures/floor-color.jpg");
    const floorNormal = texLoader.load("/textures/floor-normal.jpg");
    const floorRough = texLoader.load("/textures/floor-roughness.jpg");
    for (const t of [floorColor, floorNormal, floorRough]) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(4, 4);
    }

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({
        map: floorColor,
        normalMap: floorNormal,
        roughnessMap: floorRough,
        roughness: 1,
        metalness: 0,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.material.normalScale.set(1.8, 1.8);
    scene.add(floor);

    const fogPoolMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
    });
    const fogPool = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), fogPoolMat);
    fogPool.rotation.x = -Math.PI / 2;
    fogPool.position.set(-0.5, 0.01, 0);
    scene.add(fogPool);

    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    const loader = new GLTFLoader();

    let knightModel = null;
    let marketStall = null;
    let windmillGroup = null;
    let windmillMesh = null;
    let stallMesh = null;

    const slumpRef = { current: 0 };

    const loadKnight = () =>
      new Promise((resolve, reject) => {
        loader.load(
          "/models/knight.glb",
          (gltf) => {
            if (cancelled) {
              disposeObject3D(gltf.scene);
              resolve();
              return;
            }
            knightModel = gltf.scene;
            knightModel.position.set(-0.5, 0, 0);
            knightModel.scale.set(1.2, 1.2, 1.2);

            const clipNames = gltf.animations.map((c) => c.name);
            console.log("[Knight] animation clip names:", clipNames);

            const mixer = new THREE.AnimationMixer(knightModel);
            mixerRef.current = mixer;

            const clipByName = (name) =>
              gltf.animations.find((a) => a.name === name) ?? null;

            const make = (name) => {
              const clip = clipByName(name);
              if (!clip) {
                console.warn(`[Knight] Missing clip: "${name}"`);
                return null;
              }
              return mixer.clipAction(clip);
            };

            actionClipRef.current = make("Action");
            forwardClipRef.current = make("Forward");
            backwardClipRef.current = make("Backward");
            deathClipRef.current = make("Death");
            jumpClipRef.current = make("Jump");
            strafeClipRef.current = make("Strafe");
            tPoseClipRef.current = make("T-Pose");
            takeHitClipRef.current = make("Take Hit");
            victoryClipRef.current = make("Victory Pose");

            const actionAction = actionClipRef.current;
            const forwardAction = forwardClipRef.current;
            const victoryAction = victoryClipRef.current;
            const takeHitAction = takeHitClipRef.current;

            if (actionAction) {
              actionAction.loop = THREE.LoopRepeat;
              const cr = crimeLevelRef.current;
              actionAction.timeScale =
                cr === "moderate" ? 0.56 : 0.8;
              actionAction.play();
              currentActionRef.current = actionAction;
            }

            [
              forwardAction,
              backwardClipRef.current,
              deathClipRef.current,
              jumpClipRef.current,
              strafeClipRef.current,
              tPoseClipRef.current,
            ].forEach((a) => {
              if (a) a.loop = THREE.LoopRepeat;
            });

            if (victoryAction) {
              victoryAction.loop = THREE.LoopRepeat;
            }
            if (takeHitAction) {
              takeHitAction.loop = THREE.LoopOnce;
              takeHitAction.clampWhenFinished = true;
            }

            knightModel.traverse((c) => {
              if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });

            sceneGroup.add(knightModel);

            if (
              isGeneratingRef.current &&
              forwardAction &&
              currentActionRef.current
            ) {
              forwardAction.timeScale = 1.0;
              if (currentActionRef.current !== forwardAction) {
                currentActionRef.current.crossFadeTo(forwardAction, 0.5, true);
                currentActionRef.current = forwardAction;
              }
              prevIsGeneratingRef.current = true;
            } else {
              prevIsGeneratingRef.current = isGeneratingRef.current;
            }

            setKnightLoaded(true);
            resolve();
          },
          undefined,
          reject,
        );
      });

    const loadStall = () =>
      new Promise((resolve, reject) => {
        loader.load(
          "/models/market_stall.glb",
          (gltf) => {
            if (cancelled) {
              disposeObject3D(gltf.scene);
              resolve();
              return;
            }
            marketStall = gltf.scene;
            marketStall.position.set(-2.8, 0, -2.5);
            marketStall.scale.set(0.6, 0.6, 0.6);
            upgradeMaterials(marketStall);

            const names = collectMeshNames(marketStall);
            console.log("[Stall] mesh names:", names);

            marketStall.traverse((c) => {
              if (c.isMesh && c.name === "Cylinder054_Medieval_0") {
                stallMesh = c;
              }
            });

            const fabricMesh = findFabricMesh(marketStall);
            if (!fabricMesh) {
              console.log("[Stall] No fabric mesh — using entire stall group");
            }

            sceneGroup.add(marketStall);
            resolve();
          },
          undefined,
          reject,
        );
      });

    const loadWindmill = () =>
      new Promise((resolve, reject) => {
        loader.load(
          "/models/windmill.glb",
          (gltf) => {
            if (cancelled) {
              disposeObject3D(gltf.scene);
              resolve();
              return;
            }
            windmillGroup = gltf.scene;
            windmillGroup.position.set(3.5, 0, -3.5);
            windmillGroup.scale.set(0.7, 0.7, 0.7);
            upgradeMaterials(windmillGroup);

            const names = collectMeshNames(windmillGroup);
            console.log("[Windmill] mesh names:", names);

            windmillGroup.traverse((c) => {
              if (c.isMesh && c.name === "Windmill_Medieval_0") {
                windmillMesh = c;
              }
            });

            scene.add(windmillGroup);
            resolve();
          },
          undefined,
          reject,
        );
      });

    Promise.all([loadKnight(), loadStall(), loadWindmill()]).catch((err) => {
      if (!cancelled) console.error("[KnightScene] GLTF load error:", err);
    });

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

      const mix = mixerRef.current;
      if (mix) {
        mix.timeScale = 1.0;
        mix.update(delta);
      }

      const crime = crimeLevelRef.current;
      const targetSlump = crime === "severe" ? -0.1 : 0;
      slumpRef.current += (targetSlump - slumpRef.current) * 0.08;

      sceneGroup.rotation.y = Math.sin(time * 0.15) * 0.08;

      spotLight.position.x = Math.sin(time * 0.3) * 0.8;

      if (knightModel) {
        const breath = Math.sin(time * 1.4) * 0.012;
        knightModel.position.y = breath + slumpRef.current;
        const sy = window.scrollY;
        const ih = window.innerHeight || 1;
        knightModel.rotation.y = (sy / ih) * 0.55;
        if (sy < ih) {
          const mx = mouseXRef.current;
          knightModel.rotation.y += (mx * 0.3 - knightModel.rotation.y) * 0.02;
        }
      }

      if (windmillGroup) {
        windmillGroup.rotation.z = Math.sin(time * 0.4) * 0.008;
        windmillGroup.position.x = 3.5 + mouseXRef.current * 0.14;
      }
      if (windmillMesh) {
        windmillMesh.rotation.z += 0.003;
      }

      if (stallMesh) {
        stallMesh.rotation.z = Math.sin(time * 1.2) * 0.012;
      }

      if (marketStall) {
        marketStall.position.x = -2.8 + mouseXRef.current * 0.06;
      }

      lanternLight.intensity =
        1.6 +
        Math.sin(time * 5.5) * 0.3 +
        Math.sin(time * 13) * 0.08;

      const mx = mouseXRef.current;
      const my = mouseYRef.current;
      const targetCamX = mx * 0.3;
      const targetCamY = -my * 0.15 + 2.2;
      camera.position.x += (targetCamX - camera.position.x) * 0.03;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;

      camera.lookAt(0, 1.4, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      clearVictoryTimeout();
      clearSevereTimeout();
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      scene.remove(spotLight.target);
      scene.remove(spotLight);
      spotLight.dispose();
      scene.remove(spotLightCrimson.target);
      scene.remove(spotLightCrimson);
      spotLightCrimson.dispose();
      fogPool.geometry.dispose();
      fogPoolMat.dispose();
      scene.remove(fogPool);
      mixerRef.current = null;
      actionClipRef.current = null;
      forwardClipRef.current = null;
      backwardClipRef.current = null;
      deathClipRef.current = null;
      jumpClipRef.current = null;
      strafeClipRef.current = null;
      tPoseClipRef.current = null;
      takeHitClipRef.current = null;
      victoryClipRef.current = null;
      currentActionRef.current = null;
      if (knightModel) disposeObject3D(knightModel);
      if (marketStall) disposeObject3D(marketStall);
      if (windmillGroup) disposeObject3D(windmillGroup);
      floor.geometry.dispose();
      floor.material.dispose?.();
      [floorColor, floorNormal, floorRough].forEach((t) => t.dispose?.());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      setKnightLoaded(false);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    />
  );
}
