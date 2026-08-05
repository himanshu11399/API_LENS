/* ============================================
   APILens — 3D Interactive Hero Canvas (Upgraded API Gateway)
   ============================================ */

export function initHeroCanvas(canvasId, containerSelector) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.querySelector(containerSelector) || canvas.parentElement;

  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;

  // Track resizing
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      width = canvas.width = entry.contentRect.width;
      height = canvas.height = entry.contentRect.height;
    }
  });
  if (container) resizeObserver.observe(container);

  // 3D Engine Constants
  const FOV = 420;
  const CUBE_SIZE = 85; // slightly smaller to make room for satellite nodes
  let rotX = 0.5;
  let rotY = 0.6;
  let targetRotX = 0.5;
  let targetRotY = 0.6;

  // Parallax tracking
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - (width / 2);
    const y = e.clientY - rect.top - (height / 2);
    // Limit range and calculate targets
    targetRotY = (x / width) * 0.7 + 0.6;
    targetRotX = (y / height) * 0.7 + 0.5;
  });

  // Cube Vertices (8 corners for central gateway core)
  const vertices = [
    { x: -1, y: -1, z: -1 }, // 0
    { x: 1, y: -1, z: -1 },  // 1
    { x: 1, y: 1, z: -1 },   // 2
    { x: -1, y: 1, z: -1 },  // 3
    { x: -1, y: -1, z: 1 },  // 4
    { x: 1, y: -1, z: 1 },   // 5
    { x: 1, y: 1, z: 1 },    // 6
    { x: -1, y: 1, z: 1 }    // 7
  ];

  // Cube Edges (indices in vertices)
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Back face
    [4, 5], [5, 6], [6, 7], [7, 4], // Front face
    [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
  ];

  // Cube Faces for glass fills
  const faces = [
    [0, 1, 2, 3], // Back
    [4, 5, 6, 7], // Front
    [0, 1, 5, 4], // Bottom
    [2, 3, 7, 6], // Top
    [0, 3, 7, 4], // Left
    [1, 2, 6, 5]  // Right
  ];

  // Inner core vertices (nested smaller cube representing the CPU Router Core)
  const innerSize = 0.45;
  const innerVertices = vertices.map(v => ({
    x: v.x * innerSize,
    y: v.y * innerSize,
    z: v.z * innerSize
  }));

  // API Endpoints orbiting the Central Cube
  const endpoints = [
    { method: 'GET', color: '#10B981', radius: 175, speed: 0.012, phase: 0, axis: 'y' },
    { method: 'POST', color: '#F59E0B', radius: 185, speed: -0.009, phase: Math.PI / 2, axis: 'y' },
    { method: 'PUT', color: '#3B82F6', radius: 195, speed: 0.010, phase: Math.PI, axis: 'x' },
    { method: 'DELETE', color: '#EF4444', radius: 165, speed: -0.014, phase: Math.PI * 1.5, axis: 'z' }
  ];

  // Data streams flowing along connection lines between Orbiting Endpoints and Central Cube
  const endpointStreams = endpoints.map((ep, idx) => ({
    endpointIdx: idx,
    progress: Math.random(),
    speed: 0.008 + Math.random() * 0.006,
    direction: Math.random() > 0.5 ? 1 : -1 // 1: endpoint -> core (request), -1: core -> endpoint (response)
  }));

  // Cube edge data streams
  const edgeStreams = [];
  for (let i = 0; i < 6; i++) {
    edgeStreams.push({
      edgeIndex: Math.floor(Math.random() * edges.length),
      progress: Math.random(),
      speed: 0.01 + Math.random() * 0.015,
      color: i % 2 === 0 ? '#60A5FA' : '#A78BFA'
    });
  }

  // Floating background network particles
  const particles = [];
  const numParticles = 25;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 550,
      y: (Math.random() - 0.5) * 550,
      z: (Math.random() - 0.5) * 550 + 100,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.4,
      size: 1 + Math.random() * 2.5
    });
  }

  // Projection math
  function project(x, y, z) {
    const dist = 360; 
    const scale = FOV / (z + dist);
    return {
      x: width / 2 + x * scale,
      y: height / 2 + y * scale,
      scale: scale
    };
  }

  // Rotate point around X, Y, Z axes
  function rotatePoint(pt, ax, ay, az = 0) {
    let x = pt.x, y = pt.y, z = pt.z;

    // Rotate Y
    let cosY = Math.cos(ay), sinY = Math.sin(ay);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;

    // Rotate X
    let cosX = Math.cos(ax), sinX = Math.sin(ax);
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    // Rotate Z
    if (az !== 0) {
      let cosZ = Math.cos(az), sinZ = Math.sin(az);
      let x3 = x1 * cosZ - y2 * sinZ;
      let y3 = x1 * sinZ + y2 * cosZ;
      return { x: x3, y: y3, z: z2 };
    }

    return { x: x1, y: y2, z: z2 };
  }

  let isPlaying = true;

  // FIX: Observe the nearest static 'section' element to prevent transition-induced layout glitches (disappearing/reappearing)
  const observerTarget = canvas.closest('section') || canvas;
  const observer = new IntersectionObserver((entries) => {
    isPlaying = entries[0].isIntersecting;
    if (isPlaying) requestAnimationFrame(loop);
  }, { threshold: 0.01 });
  observer.observe(observerTarget);

  let time = 0;

  function loop() {
    if (!isPlaying) return;
    time += 0.016;

    ctx.clearRect(0, 0, width, height);

    // Ambient radial light source in center
    const ambientGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 280);
    ambientGrad.addColorStop(0, 'rgba(59, 130, 246, 0.06)');
    ambientGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.025)');
    ambientGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic rotation auto-increment
    rotX += (targetRotX - rotX) * 0.05 + 0.0012;
    rotY += (targetRotY - rotY) * 0.05 + 0.0022;

    // 1. Render Background Network Nodes
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      if (Math.abs(p.x) > 300) p.vx *= -1;
      if (Math.abs(p.y) > 300) p.vy *= -1;
      if (Math.abs(p.z) > 300) p.vz *= -1;

      const rotated = rotatePoint(p, rotX * 0.15, rotY * 0.15);
      const proj = project(rotated.x, rotated.y, rotated.z);

      ctx.fillStyle = 'rgba(167, 139, 250, 0.25)';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, p.size * proj.scale * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (dist < 130) {
          const r1 = rotatePoint(p1, rotX * 0.15, rotY * 0.15);
          const r2 = rotatePoint(p2, rotX * 0.15, rotY * 0.15);
          const proj1 = project(r1.x, r1.y, r1.z);
          const proj2 = project(r2.x, r2.y, r2.z);

          const alpha = (1 - dist / 130) * 0.12;
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(proj1.x, proj1.y);
          ctx.lineTo(proj2.x, proj2.y);
          ctx.stroke();
        }
      }
    }

    // 2. Compute dynamic orbital positions for API Endpoints with floating sine offset
    const activeEndpoints = endpoints.map((ep, idx) => {
      ep.phase += ep.speed;
      
      // Add sine-wave floating offset for organic motion
      const floatOffset = Math.sin(time * 0.8 + idx * 1.5) * 12;
      
      let orbitalPt = { x: 0, y: 0, z: 0 };
      if (ep.axis === 'y') {
        orbitalPt.x = Math.cos(ep.phase) * ep.radius;
        orbitalPt.y = floatOffset;
        orbitalPt.z = Math.sin(ep.phase) * ep.radius;
      } else if (ep.axis === 'x') {
        orbitalPt.x = floatOffset;
        orbitalPt.y = Math.cos(ep.phase) * ep.radius;
        orbitalPt.z = Math.sin(ep.phase) * ep.radius;
      } else {
        orbitalPt.x = Math.cos(ep.phase) * ep.radius;
        orbitalPt.y = Math.sin(ep.phase) * ep.radius;
        orbitalPt.z = floatOffset;
      }

      const rotated = rotatePoint(orbitalPt, rotX, rotY);
      // Compute depth-based opacity (fade when behind cube)
      const depthAlpha = Math.max(0.3, Math.min(1, (rotated.z + 250) / 400));
      return {
        ...ep,
        ...rotated,
        depthAlpha,
        proj: project(rotated.x, rotated.y, rotated.z)
      };
    });

    // 3. Project Core Cube Vertices
    const rotatedVertices = vertices.map(v => {
      const pt = { x: v.x * CUBE_SIZE, y: v.y * CUBE_SIZE, z: v.z * CUBE_SIZE };
      const rot = rotatePoint(pt, rotX, rotY);
      return {
        ...rot,
        proj: project(rot.x, rot.y, rot.z)
      };
    });

    // Project Inner Core Vertices
    const rotatedInnerVertices = innerVertices.map(v => {
      const pt = { x: v.x * CUBE_SIZE, y: v.y * CUBE_SIZE, z: v.z * CUBE_SIZE };
      const rot = rotatePoint(pt, rotX, rotY);
      return {
        ...rot,
        proj: project(rot.x, rot.y, rot.z)
      };
    });

    // 4. Draw Core Glass Faces (Depth Sorted)
    const sortedFaces = faces.map((indices, idx) => {
      const avgZ = indices.reduce((sum, i) => sum + rotatedVertices[i].z, 0) / 4;
      return { indices, avgZ, idx };
    }).sort((a, b) => b.avgZ - a.avgZ);

    sortedFaces.forEach(face => {
      ctx.beginPath();
      const p0 = rotatedVertices[face.indices[0]].proj;
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < 4; i++) {
        const pt = rotatedVertices[face.indices[i]].proj;
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
      grad.addColorStop(1, 'rgba(139, 92, 246, 0.09)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // 5. Draw Inner CPU wireframe core
    edges.forEach(edge => {
      const p1 = rotatedInnerVertices[edge[0]].proj;
      const p2 = rotatedInnerVertices[edge[1]].proj;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)'; // purple glow core
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 6. Draw Gateway Outer Neon Edges
    edges.forEach(edge => {
      const p1 = rotatedVertices[edge[0]].proj;
      const p2 = rotatedVertices[edge[1]].proj;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      ctx.strokeStyle = '#3B82F6';
      ctx.shadowColor = '#60A5FA';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.strokeStyle = '#E0F2FE';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // 7. Draw Connection Lines and Flowing Packets between core and endpoints
    activeEndpoints.forEach((ep, idx) => {
      const coreProj = project(0, 0, 0); // center
      
      // Draw dynamic connector wire
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]); // dashed connectors representing connections
      ctx.beginPath();
      ctx.moveTo(coreProj.x, coreProj.y);
      ctx.lineTo(ep.proj.x, ep.proj.y);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Update and draw streaming data packets with trailing effects
      const stream = endpointStreams[idx];
      stream.progress += stream.speed;
      if (stream.progress > 1) {
        stream.progress = 0;
        stream.direction = Math.random() > 0.5 ? 1 : -1;
      }

      // Compute coordinate interpolations
      let packetX, packetY;
      if (stream.direction === 1) {
        packetX = ep.proj.x + (coreProj.x - ep.proj.x) * stream.progress;
        packetY = ep.proj.y + (coreProj.y - ep.proj.y) * stream.progress;
      } else {
        packetX = coreProj.x + (ep.proj.x - coreProj.x) * stream.progress;
        packetY = coreProj.y + (ep.proj.y - coreProj.y) * stream.progress;
      }

      // Draw trailing particles (3 fading circles behind packet)
      for (let t = 3; t >= 1; t--) {
        const trailProgress = Math.max(0, stream.progress - t * 0.03);
        let trailX, trailY;
        if (stream.direction === 1) {
          trailX = ep.proj.x + (coreProj.x - ep.proj.x) * trailProgress;
          trailY = ep.proj.y + (coreProj.y - ep.proj.y) * trailProgress;
        } else {
          trailX = coreProj.x + (ep.proj.x - coreProj.x) * trailProgress;
          trailY = coreProj.y + (ep.proj.y - coreProj.y) * trailProgress;
        }
        const trailAlpha = (4 - t) * 0.08;
        ctx.fillStyle = ep.color.slice(0, 7) + Math.round(trailAlpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(trailX, trailY, 2.5 - t * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main packet
      ctx.fillStyle = ep.color;
      ctx.shadowColor = ep.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(packetX, packetY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 8. Draw Orbital Endpoint Spheres & HTTP Method Labels with depth opacity
    activeEndpoints.forEach(ep => {
      ctx.globalAlpha = ep.depthAlpha;

      // Draw outer glow ring
      const glowGrad = ctx.createRadialGradient(
        ep.proj.x, ep.proj.y, 2 * ep.proj.scale,
        ep.proj.x, ep.proj.y, 14 * ep.proj.scale
      );
      glowGrad.addColorStop(0, ep.color + '30');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(ep.proj.x, ep.proj.y, 14 * ep.proj.scale, 0, Math.PI * 2);
      ctx.fill();

      // Draw glowing endpoint sphere
      ctx.fillStyle = ep.color;
      ctx.shadowColor = ep.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ep.proj.x, ep.proj.y, 6 * ep.proj.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Outer white core
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ep.proj.x, ep.proj.y, 2 * ep.proj.scale, 0, Math.PI * 2);
      ctx.fill();

      // Render Label matching the HTTP Method
      ctx.fillStyle = ep.color;
      ctx.font = `bold ${Math.round(9 * ep.proj.scale)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ep.method, ep.proj.x, ep.proj.y - 12 * ep.proj.scale);

      ctx.globalAlpha = 1;
    });

    // 9. Draw Cube Edge Flow Particles
    edgeStreams.forEach(stream => {
      stream.progress += stream.speed;
      if (stream.progress > 1) {
        stream.progress = 0;
        stream.edgeIndex = Math.floor(Math.random() * edges.length);
      }

      const edge = edges[stream.edgeIndex];
      const p1 = rotatedVertices[edge[0]].proj;
      const p2 = rotatedVertices[edge[1]].proj;

      const x = p1.x + (p2.x - p1.x) * stream.progress;
      const y = p1.y + (p2.y - p1.y) * stream.progress;

      ctx.fillStyle = stream.color;
      ctx.shadowColor = stream.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(loop);
  }
}
