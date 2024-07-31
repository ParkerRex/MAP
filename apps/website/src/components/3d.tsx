"use client";
import { Center, GradientTexture, Text } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";
import type * as THREE from "three";
import { Vector3 } from "three";

extend({ GradientTexture });

const noise3D = createNoise3D(Math.random);
const names = ["Notes", "Tasks", "Health", "Chats", "Calendar"];

// Define a type for the particle object
type Particle = {
  position: [number, number, number];
  scale: number;
};

function Cloud({ name, floatOffset, ...props }) {
  const group = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);

  const particles = useMemo<Particle[]>(() => {
    const temp: Particle[] = [];
    const cloudRadius = 3;
    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = cloudRadius * Math.cbrt(Math.random());
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      const z = r * Math.cos(phi);

      const noiseValue = noise3D(x * 0.5, y * 0.5, z * 0.5);
      const scale = (Math.random() * 0.8 + 0.2) * (1 + noiseValue * 0.5);

      temp.push({ position: [x, y, z], scale });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      group.current.position.y =
        10 + Math.sin(state.clock.elapsedTime * 0.2 + floatOffset) * 2;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    setRotation([rotation[0], rotation[1] + Math.PI / 2, rotation[2]]);
  };

  return (
    <group ref={group} {...props} onClick={handleClick} scale={[0.8, 0.8, 0.8]}>
      {particles.map((particle, index) => (
        <mesh
          key={`particle-${particle.position.join("-")}-${particle.scale}`}
          position={particle.position}
          scale={particle.scale}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.8}
            metalness={0.2}
            opacity={0.7}
            transparent
          />
        </mesh>
      ))}
      <Center position={[0, -4, 0]}>
        <Text
          font="/Geist-Medium.otf"
          fontSize={1}
          color="black"
          anchorY="top"
          anchorX="center"
        >
          {name}
        </Text>
      </Center>
    </group>
  );
}

function SkyGradient() {
  return (
    <mesh position={[0, 0, -40]}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial>
        <GradientTexture
          stops={[0, 0.3, 1]}
          colors={["#237697", "#5ab8dd", "#d0f8f7"]}
          size={1024}
        />
      </meshBasicMaterial>
    </mesh>
  );
}

export default function CloudScene({
  width,
  height,
  animationSpeed = 1,
  isMobile,
}) {
  const cloudPositions = useMemo(() => {
    if (isMobile) {
      // Mobile layout: 2 rows, 2 clouds on top, 3 on bottom
      return [
        [-7, 20, 0], // Top left
        [7, 20, 0], // Top right
        [-10, 5, 0], // Bottom left
        [0, 0, 0], // Bottom center
        [10, 5, 0], // Bottom right
      ] as [number, number, number][];
    }
    // Desktop layout: single row
    return names.map(
      (_, index) => [((index - 2) / 2) * 15, 10, 0] as [number, number, number],
    );
  }, [isMobile]);

  const cameraPosition = useMemo(() => {
    return new Vector3(0, 0, isMobile ? 45 : 30);
  }, [isMobile]);

  const cloudScale = useMemo(() => {
    return isMobile ? 0.5 : 0.8;
  }, [isMobile]);

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 60 }}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Suspense fallback={null}>
        <SkyGradient />
        <ambientLight intensity={1.8} />
        <directionalLight position={[20, 20, 5]} intensity={1} castShadow />
        {cloudPositions.map((position, index) => (
          <Cloud
            key={`cloud-${names[index]}`}
            position={position}
            name={names[index]}
            floatOffset={index * 1.25 * animationSpeed}
            scale={[cloudScale, cloudScale, cloudScale]}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
