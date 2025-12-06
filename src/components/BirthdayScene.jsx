import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const BirthdayScene = ({ currentStep, onStepChange }) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const rendererRef = useRef(null)
  const animationFrameRef = useRef(null)
  const cakeRef = useRef(null)
  const candlesRef = useRef([])
  const sparklesRef = useRef([])
  const photoDiaryRef = useRef(null)
  const photosRef = useRef([])
  const candlesBlownRef = useRef(0)
  const currentStepRef = useRef(1)
  const phaseRef = useRef('candles') // candles -> cut -> wish -> whirlpool -> photos
  const knifeRef = useRef(null)
  const cutStartRef = useRef(null)
  const vortexRef = useRef(null)
  const vortexStartRef = useRef(null)
  const notesRef = useRef([])
  const clockRef = useRef(new THREE.Clock())
  const isDraggingKnifeRef = useRef(false)
  const dragPlaneRef = useRef(null)
  const bgmRef = useRef(null)

  // Initialize scene once
  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0015) // Deep space purple
    sceneRef.current = scene
    
    // Detect if mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    scene.userData.isMobile = isMobileDevice
    scene.userData.audioUnlocked = false // Track if audio has been unlocked
    
    console.log('🔍 Device detection - isMobile:', isMobileDevice)
    
    // MOBILE: Simple audio only, no Web Audio API
    if (isMobileDevice) {
      console.log('📱 MOBILE MODE: Only eating sound will play (no BGM, no Web Audio API)')
      
      // Preload eating sound for mobile
      const eatingAudioPreload = new Audio('/audio/Minecraft Eating - Sound Effect (HD) - Gaming Sound FX (youtube).mp3')
      eatingAudioPreload.preload = 'auto'
      eatingAudioPreload.setAttribute('playsinline', '')
      eatingAudioPreload.setAttribute('webkit-playsinline', '')
      eatingAudioPreload.load()
      console.log('✅ Eating sound preloaded for mobile')
      
      // Store null values for desktop-only features
      scene.userData.audioContext = null
      scene.userData.bgmGainNode = null
      scene.userData.sfxGainNode = null
    }
    // DESKTOP: Full Web Audio API with BGM
    else {
      console.log('💻 DESKTOP MODE: BGM + eating sound with Web Audio API')
      
      // Create Web Audio API context for desktop (allows multiple sounds with mixing)
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      
      // Create gain nodes for volume control
      const bgmGainNode = audioContext.createGain()
      bgmGainNode.gain.value = 0.4 // 40% volume
      bgmGainNode.connect(audioContext.destination)
      
      const sfxGainNode = audioContext.createGain()
      sfxGainNode.gain.value = 1.0 // 100% volume for sound effects
      sfxGainNode.connect(audioContext.destination)
      
      // Store audio context and gain nodes in scene
      scene.userData.audioContext = audioContext
      scene.userData.bgmGainNode = bgmGainNode
      scene.userData.sfxGainNode = sfxGainNode
      
      // Preload eating sound for desktop
      const eatingAudioPreload = new Audio('/audio/Minecraft Eating - Sound Effect (HD) - Gaming Sound FX (youtube).mp3')
      eatingAudioPreload.preload = 'auto'
      eatingAudioPreload.load()
      console.log('✅ Eating sound preloaded for desktop')
      
      // Initialize background music with Web Audio API (desktop only)
      const bgm = new Audio('/audio/D4vd_-_Here_with_me_(mp3.pm).mp3')
      bgm.loop = true
      bgm.crossOrigin = 'anonymous'
      bgm.setAttribute('playsinline', '')
      bgm.setAttribute('webkit-playsinline', '')
      bgm.preload = 'auto'
      
      // Connect BGM to Web Audio API
      const bgmSource = audioContext.createMediaElementSource(bgm)
      bgmSource.connect(bgmGainNode)
      
      bgmRef.current = bgm
      
      // Start playing BGM (with user interaction handling)
      const startBGM = () => {
        // Resume audio context on user interaction (required for mobile)
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        const playPromise = bgm.play()
        
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log('BGM autoplay blocked, waiting for user interaction')
            // If autoplay is blocked, try again on first user interaction
            const playOnInteraction = () => {
              audioContext.resume().then(() => {
                bgm.play().catch(() => console.log('BGM play failed'))
              })
              document.removeEventListener('click', playOnInteraction)
              document.removeEventListener('touchstart', playOnInteraction)
            }
            
            document.addEventListener('click', playOnInteraction, { once: true })
            document.addEventListener('touchstart', playOnInteraction, { once: true })
          })
        }
      }
      
      // Delay BGM start slightly to improve loading
      setTimeout(startBGM, 500)
      
      // Store BGM in scene for access by other functions
      scene.userData.bgm = bgm
    }
    
    // Add cosmic vortex background
    createCosmicVortexBackground(scene)

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    
    // Responsive camera positioning
    const isMobile = window.innerWidth <= 768
    const isSmallMobile = window.innerWidth <= 480
    
    if (isSmallMobile) {
      camera.position.set(0, 5, 14) // Further back for small phones
    } else if (isMobile) {
      camera.position.set(0, 5, 12) // Further back for tablets
    } else {
      camera.position.set(0, 5, 10) // Desktop
    }
    
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, // Disable antialiasing on mobile for performance
      powerPreference: "high-performance"
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)) // Lower pixel ratio on mobile
    renderer.shadowMap.enabled = !isSmallMobile // Disable shadows on small phones for performance
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    
    // Responsive control limits
    if (isSmallMobile) {
      controls.minDistance = 8
      controls.maxDistance = 25
    } else if (isMobile) {
      controls.minDistance = 6
      controls.maxDistance = 22
    } else {
      controls.minDistance = 5
      controls.maxDistance = 20
    }
    
    // Enable touch controls for mobile
    controls.enablePan = !isMobile // Disable panning on mobile
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    }
    
    controlsRef.current = controls
    
    // Store camera, controls, and onStepChange in scene for diary access
    scene.userData.camera = camera
    scene.userData.controls = controls
    scene.userData.onStepChange = onStepChange

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024 // Reduced for performance
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    scene.add(directionalLight)

    const rimLight = new THREE.DirectionalLight(0xffd700, 0.5)
    rimLight.position.set(-5, 5, -5)
    scene.add(rimLight)

    // Create cake
  const cake = createCake(scene, candlesRef, sparklesRef, candlesBlownRef)
    cakeRef.current = cake
    animateCakeEntrance(cake)

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      
      // Adjust camera position based on screen size
      const isMobile = window.innerWidth <= 768
      const isSmallMobile = window.innerWidth <= 480
      
      if (isSmallMobile) {
        camera.position.z = 14
        controls.minDistance = 8
        controls.maxDistance = 25
      } else if (isMobile) {
        camera.position.z = 12
        controls.minDistance = 6
        controls.maxDistance = 22
      } else {
        camera.position.z = 10
        controls.minDistance = 5
        controls.maxDistance = 20
      }
      
      controls.update()
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      
      const delta = clockRef.current.getDelta()
      
      controls.update()
      
      // Animate cake idle spin only during candle phase
      if (cake && phaseRef.current === 'candles') {
        cake.rotation.y += 0.0016
      }

      // Animate sparkles with lighter math
      if (sparklesRef.current.length) {
        const t = clockRef.current.elapsedTime
        const pulse = Math.sin(t * 2) * 0.15 + 1
        sparklesRef.current.forEach((s) => {
          s.rotation.x += s.userData.rotationSpeed
          s.rotation.y += s.userData.rotationSpeed
          s.position.y = s.userData.originalY + Math.sin(t * s.userData.pulseSpeed) * 0.04
          s.scale.setScalar(s.userData.baseScale * pulse)
        })
      }
      
      // Animate candles
      candlesRef.current.forEach(candle => {
        if (!candle.userData.blown && candle.userData.flame) {
          const flame = candle.userData.flame
          const time = clockRef.current.elapsedTime + candle.userData.flickerOffset
          flame.rotation.z = Math.sin(time * 4) * 0.05
          flame.rotation.x = Math.cos(time * 3) * 0.035
          const flicker = 1 + Math.sin(time * 6) * 0.06
          flame.scale.set(flicker, 1 + Math.sin(time * 1.3) * 0.16, flicker)
          
          if (candle.userData.light) {
            candle.userData.light.intensity = 2.4 + Math.sin(time * 6) * 0.35
          }
          if (candle.userData.fill) {
            candle.userData.fill.intensity = 1.1 + Math.sin(time * 4.5) * 0.2
          }
        }
      })
      
      // Animate photo diary - NO AUTO ROTATION, only on click
      if (photoDiaryRef.current && phaseRef.current === 'photos') {
        // Diary and photos stay completely still - no shaking or movement
        // Pages only turn on user click
      }

      // Knife idle animation during cut phase
      if (phaseRef.current === 'cut' && knifeRef.current && !isDraggingKnifeRef.current) {
        const time = clockRef.current.elapsedTime
        knifeRef.current.rotation.z = Math.sin(time * 2) * 0.1
      }

      // Whirlpool animation
      if (phaseRef.current === 'whirlpool' && vortexRef.current && vortexStartRef.current) {
        const elapsed = (Date.now() - vortexStartRef.current) / 1000
        const spin = 1 + elapsed * 2
        vortexRef.current.rotation.y += 0.08 * spin
        
        // Rotate individual layers at different speeds
        vortexRef.current.children.forEach((child, index) => {
          if (child.userData.rotationSpeed) {
            child.rotation.y += 0.05 * child.userData.rotationSpeed * spin
          }
        })
        
        // Pull cake downward and shrink
        if (cake) {
          cake.position.y -= 0.02 * spin
          cake.scale.multiplyScalar(0.985)
          cake.rotation.y += 0.1 * spin
          if (cake.scale.x < 0.1 && phaseRef.current === 'whirlpool') {
            phaseRef.current = 'photos'
            if (!photoDiaryRef.current) {
              const diary = createPhotoDiary(scene, photosRef)
              photoDiaryRef.current = diary
              createNotes(scene, notesRef)
              onStepChange(3)
              animateToPhotoView(cameraRef.current, controlsRef.current)
            }
          }
        }
      }
      
      renderer.render(scene, camera)
    }
    animate()

    // Handle candle clicks
    const handleClick = (event) => {
      if (phaseRef.current === 'candles') {
        handleCandleClick(event, scene, cameraRef.current, candlesRef, candlesBlownRef, onStepChange, () => beginCutScene(scene, onStepChange, knifeRef, cutStartRef, phaseRef, sceneRef, vortexRef, vortexStartRef, dragPlaneRef, cakeRef))
      } else if (phaseRef.current === 'photos') {
        handlePhotoClick(event, scene, cameraRef.current, photosRef, controlsRef.current)
      }
    }
    
    // Handle clicks and touches (mobile support)
    renderer.domElement.addEventListener('click', handleClick)
    renderer.domElement.addEventListener('touchend', handleClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', handleClick)
      renderer.domElement.removeEventListener('touchend', handleClick)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      // Stop and cleanup BGM
      if (bgmRef.current) {
        bgmRef.current.pause()
        bgmRef.current = null
      }
      renderer.dispose()
    }
  }, []) // run once; scene persists across steps

  // Track external step (for overlay), but sequencing handled internally
  useEffect(() => {
    currentStepRef.current = currentStep
    if (currentStep === 3 && !photoDiaryRef.current && phaseRef.current === 'photos') {
      const diary = createPhotoDiary(sceneRef.current, photosRef)
      photoDiaryRef.current = diary
      animateToPhotoView(cameraRef.current, controlsRef.current)
    }
  }, [currentStep, onStepChange])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}

// Helper functions
function createCosmicVortexBackground(scene) {
  // Minimal cosmic background particles
  const particleCount = 150
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  
  for (let i = 0; i < particleCount; i++) {
    // Spread particles in a sphere around the scene
    const radius = 15 + Math.random() * 10
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    
    // Purple/pink/blue cosmic colors
    const colorChoice = Math.random()
    const color = new THREE.Color()
    if (colorChoice < 0.33) {
      color.setHex(0xff1493) // Deep pink
    } else if (colorChoice < 0.66) {
      color.setHex(0x9400d3) // Purple
    } else {
      color.setHex(0x4169e1) // Royal blue
    }
    
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
    sizes[i] = Math.random() * 0.3 + 0.1
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  
  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  })
  
  const stars = new THREE.Points(geometry, material)
  scene.add(stars)
}

function createPlate() {
  const plateGeo = new THREE.CylinderGeometry(4.2, 4.3, 0.35, 32)
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x4a332b, // cocoa base
    roughness: 0.32,
    metalness: 0.22,
    emissive: 0x1a0d0a,
    emissiveIntensity: 0.15
  })
  const plate = new THREE.Mesh(plateGeo, plateMat)
  plate.receiveShadow = true
  return plate
}

function createCake(scene, candlesRef, sparklesRef, candlesBlownRef) {
  const cakeGroup = new THREE.Group()
  
  // Base plate
  const plate = createPlate()
  plate.position.y = -2.2
  cakeGroup.add(plate)

  const bottomTier = createTier(3.4, 1.5, 0x3b2a24, 0xffdfe8, sparklesRef)
  bottomTier.position.y = 0.8
  cakeGroup.add(bottomTier)
  
  const middleTier = createTier(2.6, 1.2, 0xfce4ed, 0xffa6c7, sparklesRef)
  middleTier.position.y = 2.3
  cakeGroup.add(middleTier)
  
  const topTier = createTier(1.8, 1.0, 0xfffbf4, 0xff9fba, sparklesRef)
  topTier.position.y = 3.7
  cakeGroup.add(topTier)
  
  // Keep minimal decorations (no frames)
  // reset candles collection and counter
  candlesRef.current = []
  candlesBlownRef.current = 0
  addCandles(cakeGroup, candlesRef)
  
  cakeGroup.position.y = -2
  scene.add(cakeGroup)
  return cakeGroup
}

function createTier(radius, height, baseColor, accentColor, sparklesRef) {
  const group = new THREE.Group()
  
  // Better cake body with more detail
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32)
  const material = new THREE.MeshStandardMaterial({ 
    color: baseColor, 
    roughness: 0.4,
    metalness: 0.2,
    emissive: baseColor,
    emissiveIntensity: 0.05
  })
  const cakeBody = new THREE.Mesh(geometry, material)
  cakeBody.castShadow = true
  cakeBody.receiveShadow = true
  group.add(cakeBody)
  
  // Thicker, more prominent frosting layer
  const frostingGeometry = new THREE.CylinderGeometry(radius + 0.02, radius + 0.02, 0.18, 32)
  const frostingMaterial = new THREE.MeshStandardMaterial({ 
    color: accentColor, 
    roughness: 0.2,
    metalness: 0.08,
    emissive: accentColor,
    emissiveIntensity: 0.15
  })
  const frosting = new THREE.Mesh(frostingGeometry, frostingMaterial)
  frosting.position.y = height / 2
  frosting.castShadow = true
  frosting.receiveShadow = true
  group.add(frosting)
  
  // Decorative border
  const borderGeometry = new THREE.TorusGeometry(radius, 0.08, 12, 32)
  const borderMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.1
  })
  const border = new THREE.Mesh(borderGeometry, borderMaterial)
  border.position.y = height / 2 + 0.08
  border.rotation.x = Math.PI / 2
  group.add(border)
  
  // Better drips - more realistic
  for (let i = 0; i < 12; i++) {
    const dripGeo = new THREE.CapsuleGeometry(0.08, 0.25, 4, 8)
    const dripMat = frostingMaterial.clone()
    const drip = new THREE.Mesh(dripGeo, dripMat)
    const angle = (i / 12) * Math.PI * 2
    drip.position.set(Math.cos(angle) * (radius - 0.12), height / 2 - 0.05, Math.sin(angle) * (radius - 0.12))
    drip.rotation.z = (Math.random() - 0.5) * 0.3
    drip.castShadow = true
    drip.receiveShadow = true
    group.add(drip)
  }
  
  // FANCY DECORATIONS - Edible flowers
  for (let i = 0; i < 8; i++) {
    const flowerGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const flowerMat = new THREE.MeshStandardMaterial({
      color: [0xff69b4, 0xffd700, 0xff1493, 0xffa500][i % 4],
      emissive: [0xff69b4, 0xffd700, 0xff1493, 0xffa500][i % 4],
      emissiveIntensity: 0.4,
      roughness: 0.3
    })
    const flower = new THREE.Mesh(flowerGeo, flowerMat)
    const angle = (i / 8) * Math.PI * 2
    flower.position.set(Math.cos(angle) * (radius - 0.2), height / 2 + 0.15, Math.sin(angle) * (radius - 0.2))
    group.add(flower)
    
    // Flower petals
    for (let p = 0; p < 5; p++) {
      const petalGeo = new THREE.SphereGeometry(0.04, 6, 6)
      const petal = new THREE.Mesh(petalGeo, flowerMat)
      const petalAngle = (p / 5) * Math.PI * 2
      petal.position.set(
        flower.position.x + Math.cos(petalAngle) * 0.08,
        flower.position.y,
        flower.position.z + Math.sin(petalAngle) * 0.08
      )
      group.add(petal)
    }
  }
  
  // Pearl border
  for (let i = 0; i < 24; i++) {
    const pearlGeo = new THREE.SphereGeometry(0.05, 8, 8)
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    })
    const pearl = new THREE.Mesh(pearlGeo, pearlMat)
    const angle = (i / 24) * Math.PI * 2
    pearl.position.set(Math.cos(angle) * radius, height / 2 + 0.12, Math.sin(angle) * radius)
    group.add(pearl)
  }

  // MINIMAL sparkles for performance
  for (let i = 0; i < 12; i++) {
    const sparkle = createSparkle()
    sparkle.position.set(
      (Math.random() - 0.5) * radius * 1.5,
      height / 2 + 0.1,
      (Math.random() - 0.5) * radius * 1.5
    )
    sparkle.userData.originalY = sparkle.position.y
    sparkle.userData.rotationSpeed = Math.random() * 0.02 + 0.01
    sparkle.userData.pulseSpeed = Math.random() * 0.02 + 0.01
    sparkle.userData.baseScale = 0.5 + Math.random() * 0.5
    sparkle.scale.multiplyScalar(sparkle.userData.baseScale)
    group.add(sparkle)
    sparklesRef.current.push(sparkle)
  }
  
  return group
}

function createSparkle() {
  const geometry = new THREE.OctahedronGeometry(0.04, 0)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  return new THREE.Mesh(geometry, material)
}

function addExtraDecorations(cakeGroup) {
  for (let i = 0; i < 3; i++) {
    const ribbon = createRibbon()
    ribbon.position.y = 1.6 + i * 1.5
    ribbon.rotation.y = (i * Math.PI) / 3
    cakeGroup.add(ribbon)
  }
  
  for (let i = 0; i < 8; i++) { // Reduced swirls
    const swirl = createSwirl()
    const angle = (i / 8) * Math.PI * 2
    swirl.position.set(Math.cos(angle) * 2.5, 2.3, Math.sin(angle) * 2.5)
    cakeGroup.add(swirl)
  }
}

function createRibbon() {
  const group = new THREE.Group()
  const ribbonGeometry = new THREE.TorusGeometry(2.5, 0.08, 8, 24)
  const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7ea8,
    emissive: 0xff7ea8,
    emissiveIntensity: 0.25,
    roughness: 0.4
  })
  const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial)
  ribbon.rotation.x = Math.PI / 2
  group.add(ribbon)
  
  const bowGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1)
  const bow = new THREE.Mesh(bowGeometry, ribbonMaterial)
  bow.position.set(2.5, 0, 0)
  group.add(bow)
  
  return group
}

function createSwirl() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.2, 0.3, 0),
    new THREE.Vector3(0, 0.6, 0)
  ])
  const geometry = new THREE.TubeGeometry(curve, 18, 0.028, 6, false)
  const material = new THREE.MeshStandardMaterial({
    color: 0xffd98e,
    emissive: 0xffd98e,
    emissiveIntensity: 0.35,
    roughness: 0.35
  })
  return new THREE.Mesh(geometry, material)
}

function addDecorations(cakeGroup) {
  for (let i = 0; i < 6; i++) { // Reduced hearts
    const heart = createHeart()
    const angle = (i / 6) * Math.PI * 2
    heart.position.set(Math.cos(angle) * 2.8, 2.1 + Math.random() * 0.5, Math.sin(angle) * 2.8)
    heart.rotation.y = angle
    cakeGroup.add(heart)
  }
  
  for (let i = 0; i < 8; i++) { // Reduced stars
    const star = createStar()
    const angle = (i / 8) * Math.PI * 2
    star.position.set(Math.cos(angle) * 1.8, 3.4 + Math.random() * 0.3, Math.sin(angle) * 1.8)
    cakeGroup.add(star)
  }
}

function createHeart() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(0, -0.1, -0.1, -0.2, -0.1, -0.3)
  shape.bezierCurveTo(-0.1, -0.4, 0, -0.5, 0, -0.6)
  shape.bezierCurveTo(0, -0.5, 0.1, -0.4, 0.1, -0.3)
  shape.bezierCurveTo(0.1, -0.2, 0, -0.1, 0, 0)
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02
  })
  const material = new THREE.MeshStandardMaterial({
    color: 0xff7ea8,
    emissive: 0xff7ea8,
    emissiveIntensity: 0.35,
    roughness: 0.45
  })
  return new THREE.Mesh(geometry, material)
}

function createStar() {
  const shape = new THREE.Shape()
  const outerRadius = 0.1
  const innerRadius = 0.05
  const spikes = 5
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i / (spikes * 2)) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01
  })
  const material = new THREE.MeshStandardMaterial({
    color: 0xffe8a3,
    emissive: 0xffe8a3,
    emissiveIntensity: 0.45,
    roughness: 0.35
  })
  return new THREE.Mesh(geometry, material)
}

function addCandles(cakeGroup, candlesRef) {
  // Main 20th candle at center
  const mainCandle = createNumberCandle("20")
  mainCandle.position.set(0, 4.35, 0)
  mainCandle.userData.isMain = true
  cakeGroup.add(mainCandle)
  candlesRef.current.push(mainCandle)

  // Supporting candles
  const candleCount = 5
  const radius = 1.15
  for (let i = 0; i < candleCount; i++) {
    const angle = (i / candleCount) * Math.PI * 2
    const candle = createCandle()
    candle.position.set(Math.cos(angle) * radius, 4.05, Math.sin(angle) * radius)
    candle.userData.angle = angle
    candle.userData.index = i
    candle.userData.blown = false
    cakeGroup.add(candle)
    candlesRef.current.push(candle)
  }
}

function createCandle() {
  const group = new THREE.Group()
  
  // Clickable helper (larger) for easier hits
  const hitGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.15, 10)
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
  const hit = new THREE.Mesh(hitGeo, hitMat)
  hit.position.y = 0.5
  group.add(hit)

  const candleGeometry = new THREE.CylinderGeometry(0.11, 0.11, 0.75, 12)
  const candleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff9bc2, 
    roughness: 0.35,
    metalness: 0.1 
  })
  const candleBody = new THREE.Mesh(candleGeometry, candleMaterial)
  candleBody.castShadow = true
  candleBody.receiveShadow = true
  candleBody.position.y = 0.3
  group.add(candleBody)
  
  // BIGGER, MORE VISIBLE FLAMES
  const flameGroup = new THREE.Group()
  const flameGeometry = new THREE.ConeGeometry(0.14, 0.38, 8)
  const flameMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.95
  })
  const flame = new THREE.Mesh(flameGeometry, flameMaterial)
  flame.position.y = 0.7
  flameGroup.add(flame)
  
  const innerFlameGeometry = new THREE.ConeGeometry(0.09, 0.28, 8)
  const innerFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff66,
    transparent: true,
    opacity: 0.9
  })
  const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial)
  innerFlame.position.y = 0.78
  flameGroup.add(innerFlame)
  
  // Brighter light
  const candleLight = new THREE.PointLight(0xffaa00, 7.5, 7.5)
  candleLight.position.y = 0.85
  candleLight.castShadow = true
  group.add(candleLight)
  
  const candleFill = new THREE.PointLight(0xffd6a1, 3.5, 5.0)
  candleFill.position.y = 0.75
  candleFill.castShadow = false
  group.add(candleFill)
  
  group.add(flameGroup)
  group.userData.flame = flameGroup
  group.userData.light = candleLight
  group.userData.fill = candleFill
  group.userData.flickerOffset = Math.random() * Math.PI * 2
  group.userData.hit = hit
  
  return group
}

function createNumberCandle(textValue) {
  const group = new THREE.Group()

  // Clickable helper
  const hitGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.4, 12)
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
  const hit = new THREE.Mesh(hitGeo, hitMat)
  hit.position.y = 0.7
  group.add(hit)

  // Body - taller and more prominent
  const bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.2, 16)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffe2f3,
    roughness: 0.28,
    metalness: 0.14
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.6
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Number badge - larger
  const badge = createNumberBadge(textValue)
  badge.scale.set(1.3, 1.3, 1.3)
  badge.position.set(0, 0.9, 0.25)
  group.add(badge)

  const badgeBack = badge.clone()
  badgeBack.rotation.y = Math.PI
  badgeBack.position.z = -0.25
  group.add(badgeBack)

  // MUCH BIGGER, MORE VISIBLE FLAME for 20th candle
  const flameGroup = new THREE.Group()
  const flameGeometry = new THREE.ConeGeometry(0.18, 0.52, 12)
  const flameMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.98
  })
  const flame = new THREE.Mesh(flameGeometry, flameMaterial)
  flame.position.y = 1.4
  flameGroup.add(flame)

  const innerFlameGeometry = new THREE.ConeGeometry(0.12, 0.38, 12)
  const innerFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff44,
    transparent: true,
    opacity: 0.95
  })
  const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial)
  innerFlame.position.y = 1.52
  flameGroup.add(innerFlame)

  // Much brighter lights for main candle
  const candleLight = new THREE.PointLight(0xffaa00, 10.0, 9.0)
  candleLight.position.y = 1.45
  candleLight.castShadow = true
  group.add(candleLight)

  const candleFill = new THREE.PointLight(0xffe0b0, 4.5, 6.5)
  candleFill.position.y = 1.2
  candleFill.castShadow = false
  group.add(candleFill)

  group.add(flameGroup)
  group.userData.flame = flameGroup
  group.userData.light = candleLight
  group.userData.fill = candleFill
  group.userData.flickerOffset = Math.random() * Math.PI * 2
  group.userData.hit = hit

  return group
}

function createNumberBadge(textValue) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff7fb'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#ff5c97'
  ctx.lineWidth = 10
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36)
  ctx.fillStyle = '#ff347a'
  ctx.font = 'bold 150px "Gloria Hallelujah", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(textValue, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const badgeGeo = new THREE.PlaneGeometry(0.6, 0.6)
  const badgeMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  })
  const badge = new THREE.Mesh(badgeGeo, badgeMat)
  return badge
}

function animateCakeEntrance(cake) {
  const startY = -10
  const endY = -2
  const duration = 2300
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    
    cake.position.y = startY + (endY - startY) * easeOut
    cake.rotation.y = progress * Math.PI * 2
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

function handleCandleClick(event, scene, camera, candlesRef, candlesBlownRef, onStepChange, beginCutScene) {
  const mouse = new THREE.Vector2()
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  
  // CRITICAL: Unlock audio on first user interaction (mobile fix)
  if (!scene.userData.audioUnlocked) {
    scene.userData.audioUnlocked = true
    console.log('🔓 Unlocking audio on first user interaction')
    
    const audioContext = scene.userData.audioContext
    const isMobile = scene.userData.isMobile
    
    // Desktop: Resume audio context
    if (!isMobile && audioContext && audioContext.state === 'suspended') {
      console.log('Desktop: Resuming audio context')
      audioContext.resume().then(() => {
        console.log('✅ Audio context resumed')
      }).catch(err => {
        console.log('❌ Failed to resume audio context:', err)
      })
    }
    
    // Mobile: Play a silent audio to unlock audio playback
    if (isMobile) {
      console.log('📱 Mobile: Playing silent audio to unlock')
      const silentAudio = new Audio()
      silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////////////////AAAAAAAAAAAAAAAAAAAAAP/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=='
      silentAudio.volume = 0
      silentAudio.setAttribute('playsinline', '')
      silentAudio.setAttribute('webkit-playsinline', '')
      silentAudio.play().then(() => {
        console.log('✅ Silent audio played - mobile audio unlocked!')
      }).catch(err => {
        console.log('❌ Silent audio failed:', err)
      })
    }
  }
  
  // Intersect against all child meshes for larger target
  const intersectTargets = candlesRef.current.flatMap(c => c.children)
  const intersects = raycaster.intersectObjects(intersectTargets, true)
  
  if (intersects.length > 0) {
    // Walk up to the candle root
    let candle = intersects[0].object
    while (candle && !candle.userData?.flame && candle.parent) {
      candle = candle.parent
    }
    if (!candle || !candle.userData?.flame) return

    if (candle.userData && !candle.userData.blown) {
      blowCandle(candle, scene)
      candlesBlownRef.current++
      
      if (candlesBlownRef.current === candlesRef.current.length) {
        beginCutScene()
      }
    }
  }
}

function blowCandle(candle, scene) {
  if (candle.userData.blown) return
  
  candle.userData.blown = true
  
  const flame = candle.userData.flame
  const light = candle.userData.light
  const fill = candle.userData.fill
  
  const animateOut = () => {
    const scale = flame.scale.y
    if (scale > 0) {
      flame.scale.y = Math.max(0, scale - 0.1)
      flame.scale.x = Math.max(0, flame.scale.x - 0.06)
      light.intensity = Math.max(0, light.intensity - 0.38)
      if (fill) fill.intensity = Math.max(0, fill.intensity - 0.3)
      requestAnimationFrame(animateOut)
    } else {
      flame.visible = false
      light.visible = false
      if (fill) fill.visible = false
    }
  }
  animateOut()
  
  createSmoke(candle.position, scene)
}

function createSmoke(position, scene) {
  const smokeGeometry = new THREE.BufferGeometry()
  const particleCount = 14 // further reduced for smoother perf
  const positions = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = position.x + (Math.random() - 0.5) * 0.2
    positions[i + 1] = position.y + Math.random() * 0.5
    positions[i + 2] = position.z + (Math.random() - 0.5) * 0.2
  }
  
  smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  const smokeMaterial = new THREE.PointsMaterial({
    color: 0x888888,
    size: 0.09,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  })
  
  const smoke = new THREE.Points(smokeGeometry, smokeMaterial)
  scene.add(smoke)
  
  const startTime = Date.now()
  const animate = () => {
    const elapsed = Date.now() - startTime
    if (elapsed < 2000) {
      const positions = smoke.geometry.attributes.position.array
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.02
        positions[i - 1] += (Math.random() - 0.5) * 0.01
        positions[i + 1] += (Math.random() - 0.5) * 0.01
      }
      smoke.geometry.attributes.position.needsUpdate = true
      smoke.material.opacity = Math.max(0, 0.6 - elapsed / 2000)
      requestAnimationFrame(animate)
    } else {
      scene.remove(smoke)
    }
  }
  animate()
}

function startFireworks(scene) {
  // DIWALI-STYLE FIREWORKS - Colorful, bright, and festive!
  const fireworkTypes = ['burst', 'willow', 'palm', 'ring', 'chrysanthemum', 'peony']
  const bursts = 15 // Aesthetic amount
  const interval = 350 // Slightly slower for better visibility
  
  // Diwali color palette - vibrant and festive
  const diwaliColors = [
    [0xff6b35, 0xffd700], // Orange-Gold
    [0xff1493, 0xff69b4], // Pink-HotPink
    [0x00ff00, 0x32cd32], // Green-LimeGreen
    [0x4169e1, 0x87ceeb], // Blue-SkyBlue
    [0xff4500, 0xffa500], // Red-Orange
    [0x9370db, 0xda70d6], // Purple-Orchid
  ]
  
  for (let i = 0; i < bursts; i++) {
    setTimeout(() => {
      // Launch 2-3 fireworks simultaneously
      const simultaneous = 2 + Math.floor(Math.random() * 2)
      for (let j = 0; j < simultaneous; j++) {
        const type = fireworkTypes[Math.floor(Math.random() * fireworkTypes.length)]
        const colorPair = diwaliColors[Math.floor(Math.random() * diwaliColors.length)]
        const position = new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          3.5 + Math.random() * 2.5, // Height 3.5-6
          (Math.random() - 0.5) * 5
        )
        launchFirework(scene, position, type, colorPair)
      }
    }, i * interval)
  }
}

function launchFirework(scene, position, type, colorPair = [0xffd700, 0xffa500]) {
  // Launch trail with color
  createFireworkTrail(scene, position, colorPair[0])
  
  // Main explosion after short delay
  setTimeout(() => {
    createFlashEffect(position, position.y, scene)
    
    switch(type) {
      case 'burst':
        fireworkBurst(scene, position, 300)
        break
      case 'willow':
        fireworkWillow(scene, position)
        break
      case 'palm':
        fireworkPalm(scene, position)
        break
      case 'ring':
        fireworkRing(scene, position)
        break
      case 'heart':
        fireworkHeart(scene, position)
        break
      case 'spiral':
        fireworkSpiral(scene, position)
        break
    }
  }, 300)
}

function createFireworkTrail(scene, targetPos, color = 0xffaa00) {
  const particleCount = 30
  const positions = new Float32Array(particleCount * 3)
  const startY = -2
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = targetPos.x + (Math.random() - 0.5) * 0.2
    positions[i * 3 + 1] = startY
    positions[i * 3 + 2] = targetPos.z + (Math.random() - 0.5) * 0.2
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  const material = new THREE.PointsMaterial({
    color: color,
    size: 0.15,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const trail = new THREE.Points(geometry, material)
  scene.add(trail)
  
  const start = Date.now()
  const duration = 300
  
  const animate = () => {
    const elapsed = Date.now() - start
    const progress = elapsed / duration
    const pos = geometry.getAttribute('position')
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] = startY + (targetPos.y - startY) * progress + (Math.random() - 0.5) * 0.3
    }
    pos.needsUpdate = true
    material.opacity = 0.9 - progress * 0.5
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      scene.remove(trail)
    }
  }
  animate()
}

function fireworkBurst(scene, position, count = 250) { // More particles for visibility!
  const positions = new Float32Array(count * 3)
  const velocities = []
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const hue = Math.random()
  const hue2 = (hue + 0.3) % 1
  
  for (let i = 0; i < count; i++) {
    const speed = Math.random() * 0.8 + 0.4
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    )
    
    positions[i * 3] = position.x
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z
    velocities.push(dir.multiplyScalar(speed))

    const useSecondColor = Math.random() > 0.5
    const c = new THREE.Color().setHSL(useSecondColor ? hue2 : hue, 1, 0.6)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    sizes[i] = Math.random() * 0.15 + 0.15
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    size: 0.2
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const start = Date.now()
  const duration = 2000
  
  const animate = () => {
    const elapsed = Date.now() - start
    const progress = elapsed / duration
    const pos = geometry.getAttribute('position')
    
    for (let i = 0; i < count; i++) {
      velocities[i].y -= 0.008 // gravity
      velocities[i].multiplyScalar(0.98) // drag
      
      positions[i * 3] += velocities[i].x
      positions[i * 3 + 1] += velocities[i].y
      positions[i * 3 + 2] += velocities[i].z
      
      // Sparkle effect
      if (Math.random() > 0.95) {
        sizes[i] = Math.random() * 0.3 + 0.1
      }
    }
    
    pos.needsUpdate = true
    geometry.getAttribute('size').needsUpdate = true
    material.opacity = Math.max(0, 1 - progress)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      scene.remove(points)
    }
  }
  animate()
}

function fireworkWillow(scene, position) {
  const count = 180 // More visible!
  const positions = new Float32Array(count * 3)
  const velocities = []
  const colors = new Float32Array(count * 3)

  const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const speed = Math.random() * 0.5 + 0.3
    
    positions[i * 3] = position.x
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z
    
    velocities.push(new THREE.Vector3(
      Math.cos(angle) * speed,
      -Math.abs(Math.random() * 0.3),
      Math.sin(angle) * speed
    ))

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  animateFireworkParticles(scene, positions, velocities, colors, count, 2500)
}

function fireworkPalm(scene, position) {
  const count = 140 // More visible!
  const positions = new Float32Array(count * 3)
  const velocities = []
  const colors = new Float32Array(count * 3)

  const color = new THREE.Color(0xffd700)
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const speed = Math.random() * 0.6 + 0.4
    
    positions[i * 3] = position.x
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z
    
    velocities.push(new THREE.Vector3(
      Math.cos(angle) * speed,
      Math.random() * 0.4,
      Math.sin(angle) * speed
    ))

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  animateFireworkParticles(scene, positions, velocities, colors, count, 2200)
}

function fireworkRing(scene, position) {
  const count = 60 // Reduced from 100
  const positions = new Float32Array(count * 3)
  const velocities = []
  const colors = new Float32Array(count * 3)

  const hue = Math.random()
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const speed = 0.6
    
    positions[i * 3] = position.x
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z
    
    velocities.push(new THREE.Vector3(
      Math.cos(angle) * speed,
      (Math.random() - 0.5) * 0.1,
      Math.sin(angle) * speed
    ))

    const c = new THREE.Color().setHSL(hue, 1, 0.6)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  animateFireworkParticles(scene, positions, velocities, colors, count, 1800)
}

function fireworkHeart(scene, position) {
  const count = 70 // Reduced from 120
  const positions = new Float32Array(count * 3)
  const velocities = []
  const colors = new Float32Array(count * 3)

  const color = new THREE.Color(0xff1493)
  
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    
    positions[i * 3] = position.x
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z
    
    velocities.push(new THREE.Vector3(x * 0.03, y * 0.03, (Math.random() - 0.5) * 0.2))

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  animateFireworkParticles(scene, positions, velocities, colors, count, 2000)
}

function fireworkSpiral(scene, position) {
  const count = 90 // Reduced from 180
  const positions = new Float32Array(count * 3)
  const velocities = []
  const colors = new Float32Array(count * 3)

  const hue = Math.random()
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 4
    const radius = (i / count) * 0.8
    
    positions[i * 3] = position.x
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z
    
    velocities.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 0.3,
      Math.sin(angle) * radius
    ))

    const c = new THREE.Color().setHSL((hue + i / count * 0.3) % 1, 1, 0.6)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  animateFireworkParticles(scene, positions, velocities, colors, count, 2200)
}

function animateFireworkParticles(scene, positions, velocities, colors, count, duration) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  const start = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - start
    const progress = elapsed / duration
    const pos = geometry.getAttribute('position')
    
    for (let i = 0; i < count; i++) {
      velocities[i].y -= 0.006 // gravity
      velocities[i].multiplyScalar(0.98)
      
      positions[i * 3] += velocities[i].x
      positions[i * 3 + 1] += velocities[i].y
      positions[i * 3 + 2] += velocities[i].z
    }
    
    pos.needsUpdate = true
    material.opacity = Math.max(0, 1 - progress)
    material.size = 0.2 * (1 - progress * 0.3)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      scene.remove(points)
    }
  }
  animate()
}

// (old explodeFirework removed in favor of spray)

function createExplosionLayer(position, height, colors, type, particleCount, speed, scene) {
  const particles = []
  const velocities = []
  
  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.075, 7, 7)
    const color = colors[Math.floor(Math.random() * colors.length)]
    const material = new THREE.MeshBasicMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    const particle = new THREE.Mesh(geometry, material)
    particle.position.set(position.x, height, position.z)
    scene.add(particle)
    
    let velocity
    const angle = (i / particleCount) * Math.PI * 2
    const radius = Math.random()
    
    switch(type) {
      case 'willow':
        velocity = new THREE.Vector3(
          Math.cos(angle) * speed * radius,
          -Math.abs(Math.sin(angle)) * speed * 0.3,
          Math.sin(angle) * speed * radius
        )
        break
      case 'chrysanthemum':
        velocity = new THREE.Vector3(
          Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
          (Math.random() - 0.5) * speed * 0.3,
          Math.sin(angle) * speed * (0.5 + Math.random() * 0.5)
        )
        break
      case 'palm':
        const palmAngle = angle + (Math.random() - 0.5) * 0.3
        velocity = new THREE.Vector3(
          Math.cos(palmAngle) * speed * radius,
          Math.random() * speed * 0.2,
          Math.sin(palmAngle) * speed * radius
        )
        break
      case 'ring':
        velocity = new THREE.Vector3(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * speed * 0.2,
          Math.sin(angle) * speed
        )
        break
      default:
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed
        )
    }
    
    velocities.push(velocity)
    particles.push(particle)
  }
  
  const startTime = Date.now()
  const duration = 2500
  
  const animateExplosion = () => {
    const elapsed = Date.now() - startTime
    const progress = elapsed / duration
    
    particles.forEach((particle, i) => {
      const velocity = velocities[i]
      particle.position.add(velocity)
      velocity.multiplyScalar(0.96)
      particle.material.opacity = Math.max(0, 1 - progress * 1.2)
      particle.scale.multiplyScalar(0.985)
    })
    
    if (progress < 1) {
      requestAnimationFrame(animateExplosion)
    } else {
      particles.forEach(particle => scene.remove(particle))
    }
  }
  animateExplosion()
}

function createSparkleBurst(position, height, colors, count, scene) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const geometry = new THREE.OctahedronGeometry(0.075, 0)
      const color = colors[Math.floor(Math.random() * colors.length)]
      const material = new THREE.MeshBasicMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
      const sparkle = new THREE.Mesh(geometry, material)
      sparkle.position.set(
        position.x + (Math.random() - 0.5) * 3,
        height + (Math.random() - 0.5) * 2,
        position.z + (Math.random() - 0.5) * 3
      )
      scene.add(sparkle)
      
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        if (elapsed < 1000) {
          sparkle.rotation.x += 0.1
          sparkle.rotation.y += 0.1
          sparkle.material.opacity = Math.max(0, 1 - elapsed / 1000)
          requestAnimationFrame(animate)
        } else {
          scene.remove(sparkle)
        }
      }
      animate()
    }, i * 20)
  }
}

function createFlashEffect(position, height, scene) {
  const flashGeometry = new THREE.SphereGeometry(3, 12, 12)
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const flash = new THREE.Mesh(flashGeometry, flashMaterial)
  flash.position.set(position.x, height, position.z)
  scene.add(flash)
  
  const flashStartTime = Date.now()
  const flashAnimate = () => {
    const elapsed = Date.now() - flashStartTime
    if (elapsed < 150) {
      flash.material.opacity = Math.max(0, 1 - elapsed / 150)
      flash.scale.multiplyScalar(1.15)
      requestAnimationFrame(flashAnimate)
    } else {
      scene.remove(flash)
    }
  }
  flashAnimate()
  
  const glowGeometry = new THREE.SphereGeometry(4.5, 12, 12)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.position.set(position.x, height, position.z)
  scene.add(glow)
  
  const glowStartTime = Date.now()
  const glowAnimate = () => {
    const elapsed = Date.now() - glowStartTime
    if (elapsed < 500) {
      glow.material.opacity = Math.max(0, 0.3 - elapsed / 500)
      requestAnimationFrame(glowAnimate)
    } else {
      scene.remove(glow)
    }
  }
  glowAnimate()
}

function createPhotoDiary(scene, photosRef) {
  const diaryGroup = new THREE.Group()
  
  // Create 3D book
  const book = create3DBook()
  diaryGroup.add(book)
  
  // Create pages with real photos and sticky notes
  const pages = []
  const photoFiles = [
    '/photos/WhatsApp Image 2025-12-05 at 11.27.31 AM.jpeg',
    '/photos/WhatsApp Image 2025-12-05 at 11.30.23 AM.jpeg',
    '/photos/WhatsApp Image 2025-12-05 at 11.41.23 AM.jpeg',
    '/photos/WhatsApp Image 2025-12-05 at 11.43.59 AM.jpeg',
    '/photos/WhatsApp Image 2025-12-05 at 2.29.34 PM (1).jpeg',
    '/photos/WhatsApp Image 2025-12-05 at 2.29.34 PM.jpeg',
    '/photos/WhatsApp Image 2025-12-05 at 2.29.35 PM (1).jpeg',
    '/photos/WhatsApp Image 2025-12-05 at 2.29.35 PM.jpeg',
    '/photos/WhatsApp Image 2025-12-06 at 1.16.49 PM.jpeg',
    '/photos/WhatsApp Image 2025-12-06 at 1.16.49 PM (1).jpeg',
    '/photos/WhatsApp Image 2025-12-06 at 1.16.49 PM (2).jpeg',
    '/photos/WhatsApp Image 2025-12-06 at 1.16.50 PM.jpeg'
  ]
  
  // Create 4 pages (increased from 3 to accommodate more photos)
  for (let i = 0; i < 4; i++) {
    const page = createDiaryPage(i, photoFiles.slice(i * 3, i * 3 + 3))
    page.position.set(0, 0, 0.01 * i)
    page.userData.pageNumber = i
    page.userData.isVisible = i === 0
    // CRITICAL: Only page 0 visible, all others completely hidden
    page.visible = i === 0
    page.rotation.y = 0 // Ensure no rotation on hidden pages
    diaryGroup.add(page)
    pages.push(page)
  }
  
  diaryGroup.userData.pages = pages
  diaryGroup.userData.currentPage = 0
  diaryGroup.userData.isAnimating = false
  diaryGroup.position.set(0, 1, 0)
  diaryGroup.rotation.x = -Math.PI / 6
  
  scene.add(diaryGroup)
  return diaryGroup
}

function create3DBook() {
  const bookGroup = new THREE.Group()
  
  // Book cover
  const coverGeo = new THREE.BoxGeometry(6, 8, 0.2)
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.1
  })
  const cover = new THREE.Mesh(coverGeo, coverMat)
  bookGroup.add(cover)
  
  // Book spine
  const spineGeo = new THREE.BoxGeometry(0.3, 8, 0.2)
  const spine = new THREE.Mesh(spineGeo, coverMat)
  spine.position.x = -3
  bookGroup.add(spine)
  
  // Gold title
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 60px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Memories', canvas.width / 2, canvas.height / 2 + 20)
  
  const titleTexture = new THREE.CanvasTexture(canvas)
  const titleGeo = new THREE.PlaneGeometry(4, 1)
  const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true })
  const title = new THREE.Mesh(titleGeo, titleMat)
  title.position.set(0, 2, 0.11)
  bookGroup.add(title)
  
  return bookGroup
}

function createDiaryPage(pageNum, photoFiles) {
  const pageGroup = new THREE.Group()
  
  // Lock page group rotation to prevent any movement
  pageGroup.rotation.set(0, 0, 0)
  pageGroup.matrixAutoUpdate = true
  
  // Page background
  const pageGeo = new THREE.PlaneGeometry(5.5, 7.5)
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xfffef0,
    roughness: 0.9,
    side: THREE.DoubleSide
  })
  const page = new THREE.Mesh(pageGeo, pageMat)
  page.position.z = 0.11
  pageGroup.add(page)
  
  const loader = new THREE.TextureLoader()
  
  // Add 2-3 photos per page
  photoFiles.forEach((photoFile, index) => {
    if (index < 3) {
      loader.load(photoFile, (texture) => {
        const photoGeo = new THREE.PlaneGeometry(2, 2.5)
        const photoMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
        const photo = new THREE.Mesh(photoGeo, photoMat)
        
        // Position photos
        const positions = [
          [-1.5, 2, 0.12],
          [1.5, 2, 0.12],
          [0, -1.5, 0.12]
        ]
        
        if (positions[index]) {
          photo.position.set(...positions[index])
          photo.rotation.set(0, 0, 0) // No rotation - perfectly straight
          pageGroup.add(photo)
        }
      })
    }
  })
  
  // Add sticky notes
  const stickyNotes = [
    { text: 'Happy birthday Omani!', color: 0xffff99, pos: [-1.5, -2.5] },
    { text: 'Bakwas nhi krunga!', color: 0xffb3d9, pos: [1.5, -2.5] }
  ]
  
  stickyNotes.forEach(note => {
    const noteGroup = createStickyNote(note.text, note.color)
    noteGroup.position.set(note.pos[0], note.pos[1], 0.13)
    pageGroup.add(noteGroup)
  })
  
  return pageGroup
}

function createStickyNote(text, color) {
  const noteGroup = new THREE.Group()
  
  // Note background
  const noteGeo = new THREE.PlaneGeometry(1.5, 1.2)
  const noteMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    side: THREE.DoubleSide
  })
  const note = new THREE.Mesh(noteGeo, noteMat)
  noteGroup.add(note)
  
  // Text on note
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // White text
  ctx.font = 'bold 26px "Comic Sans MS", cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Add shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 3
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  
  const lines = text.split(' ')
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (i - lines.length / 2) * 32)
  })
  
  const textTexture = new THREE.CanvasTexture(canvas)
  const textGeo = new THREE.PlaneGeometry(1.4, 1.1)
  const textMat = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true })
  const textMesh = new THREE.Mesh(textGeo, textMat)
  textMesh.position.z = 0.01
  noteGroup.add(textMesh)
  
  return noteGroup
}

function createPhotoAmbience(parent) {
  const particleCount = 200
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    const radius = Math.random() * 6 + 2
    const angle = Math.random() * Math.PI * 2
    const height = (Math.random() - 0.5) * 8
    
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = height
    positions[i * 3 + 2] = Math.sin(angle) * radius
    
    const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.6)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const particles = new THREE.Points(geometry, material)
  parent.add(particles)
}

function createPhotoFrame(index, size = 2.5) {
  const group = new THREE.Group()
  
  const frameThickness = 0.15
  const frameWidth = size
  const frameHeight = size * 1.3
  
  // 3D frame with depth
  const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameThickness)
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5a3823, 
    roughness: 0.4,
    metalness: 0.1
  })
  const frame = new THREE.Mesh(frameGeometry, frameMaterial)
  frame.castShadow = true
  frame.receiveShadow = true
  group.add(frame)
  
  // Photo with gradient
  const photoGeometry = new THREE.PlaneGeometry(frameWidth * 0.8, frameHeight * 0.85)
  const hue = (index * 0.15) % 1
  const photoMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, 0.6, 0.5),
    emissive: new THREE.Color().setHSL(hue, 0.4, 0.3),
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide
  })
  const photo = new THREE.Mesh(photoGeometry, photoMaterial)
  photo.position.z = frameThickness / 2 + 0.02
  group.add(photo)
  
  group.userData.photoMaterial = photoMaterial
  group.userData.photoMesh = photo
  
  // Decorative corners
  const cornerGeometry = new THREE.SphereGeometry(0.08, 8, 8)
  const cornerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffd700,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3
  })
  
  const corners = [
    [-frameWidth/2 * 0.8, frameHeight/2 * 0.85],
    [frameWidth/2 * 0.8, frameHeight/2 * 0.85],
    [-frameWidth/2 * 0.8, -frameHeight/2 * 0.85],
    [frameWidth/2 * 0.8, -frameHeight/2 * 0.85]
  ]
  corners.forEach(([x, y]) => {
    const corner = new THREE.Mesh(cornerGeometry, cornerMaterial)
    corner.position.set(x, y, frameThickness / 2 + 0.05)
    group.add(corner)
  })
  
  // Glowing aura around photo
  const glowGeometry = new THREE.PlaneGeometry(frameWidth * 0.9, frameHeight * 0.95)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setHSL(hue, 0.8, 0.6),
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.position.z = frameThickness / 2 + 0.01
  group.add(glow)
  
  // Add spotlight for each photo
  const spotlight = new THREE.SpotLight(new THREE.Color().setHSL(hue, 0.7, 0.6), 0.8, 4, Math.PI / 6, 0.5)
  spotlight.position.set(0, 0, 1)
  spotlight.target = photo
  group.add(spotlight)
  
  return group
}

function handlePhotoClick(event, scene, camera, photosRef, controls) {
  const mouse = new THREE.Vector2()
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  
  // Check if clicking on diary
  const diary = scene.children.find(child => child.userData.pages)
  if (diary) {
    const intersects = raycaster.intersectObjects(diary.children, true)
    if (intersects.length > 0) {
      // Turn page
      turnDiaryPage(diary, mouse.x > 0 ? 1 : -1)
      return
    }
  }
  
  const intersects = raycaster.intersectObjects(photosRef.current, true)
  
  if (intersects.length > 0) {
    const photo = intersects[0].object.parent
    animatePhotoFocus(photo, camera, controls)
  }
}

function turnDiaryPage(diary, direction) {
  const pages = diary.userData.pages
  const currentPage = diary.userData.currentPage
  const nextPage = currentPage + direction
  
  if (nextPage < 0 || nextPage >= pages.length) return
  
  // Prevent multiple simultaneous page turns
  if (diary.userData.isAnimating) return
  diary.userData.isAnimating = true
  
  // Hide current page with animation
  const current = pages[currentPage]
  const next = pages[nextPage]
  
  const startTime = Date.now()
  const duration = 800
  
  const animatePageTurn = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    if (direction > 0) {
      // Turn right
      current.rotation.y = -progress * Math.PI
      if (progress > 0.5 && !next.visible) {
        next.visible = true
        next.rotation.y = Math.PI
      }
      if (next.visible) {
        next.rotation.y = Math.PI * (1 - progress)
      }
    } else {
      // Turn left
      current.rotation.y = progress * Math.PI
      if (progress > 0.5 && !next.visible) {
        next.visible = true
        next.rotation.y = -Math.PI
      }
      if (next.visible) {
        next.rotation.y = -Math.PI * (1 - progress)
      }
    }
    
    if (progress < 1) {
      requestAnimationFrame(animatePageTurn)
    } else {
      current.visible = false
      current.rotation.y = 0
      next.rotation.y = 0
      diary.userData.currentPage = nextPage
      diary.userData.isAnimating = false
    }
  }
  
  animatePageTurn()
}

function animatePhotoFocus(photo, camera, controls) {
  const targetPosition = photo.position.clone()
  targetPosition.z += 3
  
  const startPosition = camera.position.clone()
  const duration = 1000
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    
    camera.position.lerpVectors(startPosition, targetPosition, easeOut)
    controls.target.copy(photo.position)
    controls.update()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      setTimeout(() => {
        animatePhotoBack(camera, controls)
      }, 2000)
    }
  }
  animate()
}

function animatePhotoBack(camera, controls) {
  const targetPosition = new THREE.Vector3(0, 2, 8)
  const startPosition = camera.position.clone()
  const duration = 1000
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    
    camera.position.lerpVectors(startPosition, targetPosition, easeOut)
    controls.target.set(0, 0, 0)
    controls.update()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

function animateToPhotoView(camera, controls) {
  const targetPosition = new THREE.Vector3(0, 2, 8)
  const startPosition = camera.position.clone()
  const duration = 2000
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    
    camera.position.lerpVectors(startPosition, targetPosition, easeOut)
    controls.target.set(0, 0, 0)
    controls.update()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

// --- New sequences and helpers ---
function beginCutScene(scene, onStepChange, knifeRef, cutStartRef, phaseRef, sceneRef, vortexRef, vortexStartRef, dragPlaneRef, cakeRef) {
  phaseRef.current = 'cut'
  onStepChange(1.5)
  
  const knife = createKnife()
  // Position knife FAR AWAY from cake initially
  knife.position.set(-8, 6, 3) // Start far to the left and above
  knife.rotation.x = 0
  knife.rotation.y = 0  
  knife.rotation.z = Math.PI / 2 // Rotate so knife is vertical (blade points down)
  scene.add(knife)
  knifeRef.current = knife
  
  // Animate knife moving to cake position first
  const moveStart = Date.now()
  const moveDuration = 2000
  
  const moveKnifeToCake = () => {
    const elapsed = Date.now() - moveStart
    const progress = Math.min(elapsed / moveDuration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    
    // Move knife from far away to above cake
    knife.position.x = -8 + eased * 8 // Move to x=0
    knife.position.y = 6 - eased * 1 // Move to y=5
    knife.position.z = 3 - eased * 3 // Move to z=0
    
    if (progress < 1) {
      requestAnimationFrame(moveKnifeToCake)
    } else {
      // Now start cutting
      setTimeout(() => {
        finishCutScene(onStepChange, sceneRef, knifeRef, phaseRef, vortexRef, vortexStartRef, dragPlaneRef, cakeRef)
      }, 500)
    }
  }
  
  moveKnifeToCake()
}

function finishCutScene(onStepChange, sceneRef, knifeRef, phaseRef, vortexRef, vortexStartRef, dragPlaneRef, cakeRef) {
  if (!knifeRef.current) return
  
  const knife = knifeRef.current
  const cake = cakeRef.current
  
  // CUT 1: Vertical cut
  animateFirstCut(knife, sceneRef.current, () => {
    // CUT 2: Horizontal cut
    animateSecondCut(knife, sceneRef.current, () => {
      // Remove knife
      knife.parent && knife.parent.remove(knife)
      knifeRef.current = null
      
      // Extract slice and move cake away
      extractSliceAndMoveCake(cake, sceneRef.current, onStepChange, vortexRef, vortexStartRef, phaseRef)
    })
  })
  
  if (dragPlaneRef && dragPlaneRef.current) {
    dragPlaneRef.current.parent && dragPlaneRef.current.parent.remove(dragPlaneRef.current)
    dragPlaneRef.current = null
  }
}

function animateFirstCut(knife, scene, onComplete) {
  const startTime = Date.now()
  const duration = 1800 // Slower, smoother
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Smooth easing for cutting motion
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    
    // Move knife DOWN through cake smoothly
    knife.position.y = 5 - eased * 8
    
    if (progress < 1) {
      if (Math.random() > 0.6) createCutSparkle(scene, knife.position)
      requestAnimationFrame(animate)
    } else {
      // Move knife back up smoothly
      setTimeout(() => {
        const liftStart = Date.now()
        const liftDuration = 1000
        const liftUp = () => {
          const elapsed = Date.now() - liftStart
          const progress = Math.min(elapsed / liftDuration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          knife.position.y = -3 + eased * 8 // Back to y=5
          if (progress < 1) {
            requestAnimationFrame(liftUp)
          } else {
            onComplete()
          }
        }
        liftUp()
      }, 500)
    }
  }
  animate()
}

function animateSecondCut(knife, scene, onComplete) {
  // Move knife to a different position and rotate for second cut
  const moveStart = Date.now()
  const moveDuration = 800
  
  const moveToSecondPosition = () => {
    const elapsed = Date.now() - moveStart
    const progress = Math.min(elapsed / moveDuration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    
    // Move knife to the side for perpendicular cut
    knife.position.x = eased * 1.2 // Move to x=1.2 (different position)
    knife.position.z = eased * 0.8 // Slight forward movement
    
    // Rotate around Z-axis to change cutting direction (perpendicular cut)
    knife.rotation.z = (Math.PI / 2) + (eased * Math.PI / 2)
    
    if (progress < 1) {
      requestAnimationFrame(moveToSecondPosition)
    } else {
      // Second cut - cut down again SMOOTHLY at new position
      const cutStart = Date.now()
      const cutDuration = 1800
      
      const cut = () => {
        const elapsed = Date.now() - cutStart
        const progress = Math.min(elapsed / cutDuration, 1)
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
        knife.position.y = 5 - eased * 8
        
        if (progress < 1) {
          if (Math.random() > 0.6) createCutSparkle(scene, knife.position)
          requestAnimationFrame(cut)
        } else {
          onComplete()
        }
      }
      cut()
    }
  }
  moveToSecondPosition()
}

function extractSliceAndMoveCake(cake, scene, onStepChange, vortexRef, vortexStartRef, phaseRef) {
  // Create cake slice
  const slice = createCakePiece(scene)
  slice.position.set(0, 0, 0)
  
  const startTime = Date.now()
  const duration = 2000
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Move whole cake to the side
    if (cake) {
      cake.position.x = -progress * 15
    }
    
    // Lift and move slice forward
    slice.position.y = progress * 1.5
    slice.position.z = progress * 3
    slice.rotation.y = progress * Math.PI / 4
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // Zoom camera on slice
      zoomOnSlice(scene, slice, onStepChange, vortexRef, vortexStartRef, phaseRef)
    }
  }
  animate()
}

function zoomOnSlice(scene, slice, onStepChange, vortexRef, vortexStartRef, phaseRef) {
  // Camera zoom handled by controls, just start eating sequence
  setTimeout(() => {
    beginWish(onStepChange, scene, slice, vortexRef, vortexStartRef, phaseRef)
  }, 500)
}

function createCutSparkle(scene, position) {
  const sparkleGeo = new THREE.SphereGeometry(0.05, 8, 8)
  const sparkleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
  })
  const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat)
  sparkle.position.copy(position)
  sparkle.position.x += (Math.random() - 0.5) * 0.3
  sparkle.position.z += (Math.random() - 0.5) * 0.3
  scene.add(sparkle)
  
  const velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.1,
    Math.random() * 0.1,
    (Math.random() - 0.5) * 0.1
  )
  
  const startTime = Date.now()
  const animate = () => {
    const elapsed = Date.now() - startTime
    if (elapsed < 500) {
      sparkle.position.add(velocity)
      velocity.y -= 0.005
      sparkle.material.opacity = Math.max(0, 1 - elapsed / 500)
      requestAnimationFrame(animate)
    } else {
      scene.remove(sparkle)
    }
  }
  animate()
}

function createCakeSliceEffect(scene) {
  // Create glowing cut line effect
  const lineGeometry = new THREE.BoxGeometry(4, 0.05, 0.05)
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
  })
  const cutLine = new THREE.Mesh(lineGeometry, lineMaterial)
  cutLine.position.set(0, 0, 0)
  scene.add(cutLine)
  
  const startTime = Date.now()
  const animate = () => {
    const elapsed = Date.now() - startTime
    if (elapsed < 1000) {
      cutLine.material.opacity = Math.max(0, 1 - elapsed / 1000)
      cutLine.scale.y = 1 + elapsed / 500
      requestAnimationFrame(animate)
    } else {
      scene.remove(cutLine)
    }
  }
  animate()
}

function createCakePiece(scene) {
  // Create a CUTE triangular cake slice with decorations
  const group = new THREE.Group()
  
  // Create 3 layers stacked perfectly with NO gaps
  const layerHeight = 0.5
  const colors = [0x8b4513, 0xffb6d9, 0xfff0f5] // Chocolate, pink, cream
  const frostingColors = [0xffc0e3, 0xffaad4, 0xff99cc]
  
  for (let layer = 0; layer < 3; layer++) {
    // Cake layer shape - slightly rounded for cuteness
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.5, 0)
    shape.lineTo(0.75, 1.2)
    shape.closePath()
    
    // Solid layer with bevel for smooth edges
    const extrudeSettings = { 
      depth: layerHeight, 
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3
    }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[layer],
      roughness: 0.5,
      metalness: 0.05
    })
    
    const cakeLayer = new THREE.Mesh(geometry, material)
    cakeLayer.rotation.x = Math.PI / 2
    cakeLayer.position.y = layer * layerHeight
    cakeLayer.castShadow = true
    cakeLayer.receiveShadow = true
    group.add(cakeLayer)
    
    // Thick creamy frosting between layers
    if (layer < 2) {
      const frostingShape = new THREE.Shape()
      frostingShape.moveTo(0, 0)
      frostingShape.lineTo(1.5, 0)
      frostingShape.lineTo(0.75, 1.2)
      frostingShape.closePath()
      
      const frostingGeo = new THREE.ExtrudeGeometry(frostingShape, { depth: 0.08, bevelEnabled: false })
      const frostingMat = new THREE.MeshStandardMaterial({ 
        color: frostingColors[layer],
        emissive: frostingColors[layer],
        emissiveIntensity: 0.4,
        roughness: 0.15,
        metalness: 0.05
      })
      const frosting = new THREE.Mesh(frostingGeo, frostingMat)
      frosting.rotation.x = Math.PI / 2
      frosting.position.y = (layer + 1) * layerHeight
      group.add(frosting)
    }
  }
  
  // Add cute decorations on top
  // Little strawberry on top
  const strawberryGeo = new THREE.SphereGeometry(0.12, 8, 8)
  const strawberryMat = new THREE.MeshStandardMaterial({
    color: 0xff3366,
    emissive: 0xff3366,
    emissiveIntensity: 0.3,
    roughness: 0.4
  })
  const strawberry = new THREE.Mesh(strawberryGeo, strawberryMat)
  strawberry.position.set(0.75, 1.55, 0.6)
  strawberry.scale.set(1, 1.2, 1)
  group.add(strawberry)
  
  // Green leaf on strawberry
  const leafGeo = new THREE.ConeGeometry(0.08, 0.06, 5)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22 })
  const leaf = new THREE.Mesh(leafGeo, leafMat)
  leaf.position.set(0.75, 1.62, 0.6)
  leaf.rotation.x = Math.PI
  group.add(leaf)
  
  // Cute sparkles around slice
  for (let i = 0; i < 5; i++) {
    const sparkleGeo = new THREE.OctahedronGeometry(0.04, 0)
    const sparkleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    })
    const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat)
    sparkle.position.set(
      Math.random() * 1.5,
      Math.random() * 1.5,
      Math.random() * 1.2
    )
    group.add(sparkle)
  }
  
  group.position.set(0, 0, 0)
  scene.add(group)
  return group
}

function createCharacter(scene) {
  // Load photo as character - BIGGER SIZE
  const loader = new THREE.TextureLoader()
  const texture = loader.load('/photos/WhatsApp Image 2025-12-06 at 1.16.49 PM (2).jpeg')
  
  const geometry = new THREE.PlaneGeometry(2.5, 3.5) // Much bigger!
  const material = new THREE.MeshBasicMaterial({ 
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  })
  const character = new THREE.Mesh(geometry, material)
  character.position.set(-8, 1.5, 0) // Start further away
  scene.add(character)
  return character
}

function animateCharacterEating(character, cakePiece, scene, onComplete) {
  const audioContext = scene.userData.audioContext
  const sfxGainNode = scene.userData.sfxGainNode
  const isMobile = scene.userData.isMobile
  
  console.log('🍰 Starting eating animation - isMobile:', isMobile)
  
  // Create eating sound audio element
  const audio = new Audio('/audio/Minecraft Eating - Sound Effect (HD) - Gaming Sound FX (youtube).mp3')
  audio.playbackRate = 0.85 // 15% slower
  audio.volume = 1.0 // Full volume
  audio.preload = 'auto'
  audio.setAttribute('playsinline', '')
  audio.setAttribute('webkit-playsinline', '')
  audio.load()
  
  // MOBILE: Simple audio element only (no Web Audio API)
  if (isMobile) {
    console.log('📱 Mobile: Using simple <audio> element for eating sound')
  }
  // DESKTOP: Connect to Web Audio API for mixing with BGM
  else {
    try {
      audio.crossOrigin = 'anonymous'
      const audioSource = audioContext.createMediaElementSource(audio)
      audioSource.connect(sfxGainNode)
      console.log('💻 Desktop: Connected eating sound to Web Audio API')
    } catch (error) {
      console.log('⚠️ MediaElementSource error (using fallback):', error)
    }
  }
  
  // Store audio in scene
  scene.userData.eatingAudio = audio
  
  const startTime = Date.now()
  const walkDuration = 7500 // Walk duration (7.5 seconds - 25% slower)
  
  // Phase 1: NATURAL WALKING from RIGHT with subtle movement
  let hasReachedCake = false
  
  const walkToCake = () => {
    if (hasReachedCake) return // Stop if already reached
    
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / walkDuration, 1)
    
    if (progress >= 1) {
      // IMMEDIATELY STOP all movement - set final position
      hasReachedCake = true
      character.position.x = 1
      character.position.y = 1.5
      character.position.z = 1
      character.rotation.x = 0
      character.rotation.y = 0
      character.rotation.z = 0
      
      // Phase 2: Eat cake slowly
      // Lower BGM volume when eating sound starts using Web Audio API gain node
      const bgmGainNode = scene.userData.bgmGainNode
      if (bgmGainNode) {
        const fadeOutStart = Date.now()
        const fadeOutDuration = 1500 // Longer fade for smoother transition
        const originalVolume = bgmGainNode.gain.value
        
        const fadeOut = () => {
          const elapsed = Date.now() - fadeOutStart
          const progress = Math.min(elapsed / fadeOutDuration, 1)
          // Smooth exponential fade
          const easedProgress = 1 - Math.pow(1 - progress, 3)
          bgmGainNode.gain.value = originalVolume * (1 - easedProgress * 0.95) // Lower to 5% with smooth curve
          
          if (progress < 1) {
            requestAnimationFrame(fadeOut)
          }
        }
        fadeOut()
      }
      
      // PLAY EATING SOUND
      setTimeout(() => {
        // Desktop: Resume audio context if needed
        if (!isMobile && audioContext && audioContext.state === 'suspended') {
          console.log('💻 Resuming audio context for desktop')
          audioContext.resume()
        }
        
        let playCount = 0
        const maxPlays = 2 // Play twice (100% more = 50% additional time)
        
        const playAudio = () => {
          console.log('🔊 PLAYING EATING SOUND')
          console.log('   - Device:', isMobile ? 'Mobile 📱' : 'Desktop 💻')
          console.log('   - Audio ready:', audio.readyState >= 2 ? 'Yes ✅' : 'No ❌')
          
          // Play the audio
          audio.play()
            .then(() => {
              console.log('✅ SUCCESS: Eating audio is playing!')
            })
            .catch((error) => {
              console.error('❌ FAILED to play eating audio:', error.name, error.message)
              // Retry once
              setTimeout(() => {
                console.log('🔄 Retrying audio play...')
                audio.play().catch(e => console.error('❌ Retry also failed:', e.message))
              }, 200)
            })
        }
        
        // Replay audio for 50% more duration
        audio.addEventListener('ended', () => {
          playCount++
          console.log('🔁 Audio ended, playCount:', playCount, '/', maxPlays)
          if (playCount < maxPlays) {
            audio.currentTime = 0
            playAudio()
          }
        })
        
        // Start playing
        playAudio()
      }, 100)
      
      eatCake()
      return // Exit after starting eating
    }
    
    // Continue walking animation
    const eased = 1 - Math.pow(1 - progress, 3)
    
    // Walk from RIGHT side with gentle bobbing motion
    character.position.x = 10 - eased * 9 // Start from RIGHT (10), end at 1
    
    // Gentle walking bounce - reduced movement
    const steps = progress * 10 // Number of steps
    const stepHeight = Math.abs(Math.sin(steps * Math.PI)) * 0.12
    character.position.y = 1.5 + stepHeight
    
    // Move forward smoothly
    character.position.z = 4 - eased * 3
    
    // Subtle sway - much less movement
    character.rotation.y = Math.sin(steps * Math.PI) * 0.06
    character.rotation.z = Math.sin(steps * Math.PI * 2) * 0.03
    
    // Very slight tilt
    character.rotation.x = Math.sin(steps * Math.PI) * 0.02
    
    requestAnimationFrame(walkToCake)
  }
  
  walkToCake()
  
  const eatCake = () => {
    let bites = 0
    const biteInterval = 1200 // Slower bites
    
    const takeBite = () => {
      if (bites < 3) {
        // Shrink cake piece
        cakePiece.scale.multiplyScalar(0.5)
        
        // Character eating animation - lean forward
        const leanStart = Date.now()
        const leanDuration = 400
        
        const lean = () => {
          const elapsed = Date.now() - leanStart
          const progress = Math.min(elapsed / leanDuration, 1)
          
          if (progress < 0.5) {
            character.rotation.x = -progress * 0.6
          } else {
            character.rotation.x = -(1 - progress) * 0.6
          }
          
          if (progress < 1) {
            requestAnimationFrame(lean)
          }
        }
        lean()
        
        bites++
        setTimeout(takeBite, biteInterval)
      } else {
        // Remove cake piece
        scene.remove(cakePiece)
        
        // Restore BGM volume after eating ends using Web Audio API gain node
        const bgmGainNode = scene.userData.bgmGainNode
        if (bgmGainNode) {
          const fadeInStart = Date.now()
          const fadeInDuration = 2000 // Longer fade for smoother transition
          const currentVolume = bgmGainNode.gain.value
          const targetVolume = 0.4 // Original volume
          
          const fadeIn = () => {
            const elapsed = Date.now() - fadeInStart
            const progress = Math.min(elapsed / fadeInDuration, 1)
            // Smooth exponential fade in
            const easedProgress = 1 - Math.pow(1 - progress, 3)
            bgmGainNode.gain.value = currentVolume + (targetVolume - currentVolume) * easedProgress
            
            if (progress < 1) {
              requestAnimationFrame(fadeIn)
            }
          }
          fadeIn()
        }
        
        // Show "Happiest Birthday Kareena" message
        if (scene.userData.onStepChange) {
          scene.userData.onStepChange(2.5)
        }
        
        // Victory pose then complete
        character.rotation.z = Math.PI / 8
        setTimeout(() => {
          scene.remove(character)
          onComplete()
        }, 3000)
      }
    }
    
    takeBite()
  }
  
  walkToCake()
}

function beginWish(onStepChange, scene, cakePiece, vortexRef, vortexStartRef, phaseRef) {
  onStepChange(2)
  
  // Create character (image) that walks in slowly
  const character = createCharacter(scene)
  
  // Animate eating sequence
  animateCharacterEating(character, cakePiece, scene, () => {
    // After eating, show fireworks, balloons, and confetti
    startFireworks(scene)
    createBalloons(scene)
    createConfetti(scene)
    
    setTimeout(() => {
      // Go straight to diary
      phaseRef.current = 'photos'
      onStepChange(3)
      
      // Create diary
      const diary = createPhotoDiary(scene, { current: [] })
      
      // Animate camera to diary
      animateToPhotoView(scene.userData.camera, scene.userData.controls)
    }, 3000)
  })
}

function createKnife() {
  const group = new THREE.Group()
  
  // SIMPLE CLEAN KNIFE BLADE - bright silver, no weird points
  const bladeGeo = new THREE.BoxGeometry(2.5, 0.4, 0.05)
  const bladeMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, // Bright white silver
    metalness: 1.0, 
    roughness: 0.05,
    emissive: 0xcccccc,
    emissiveIntensity: 0.3
  })
  
  const blade = new THREE.Mesh(bladeGeo, bladeMat)
  blade.position.set(0, 0, 0)
  blade.castShadow = true
  blade.receiveShadow = true
  group.add(blade)

  // Rounded tip
  const tipGeo = new THREE.SphereGeometry(0.2, 16, 16)
  const tip = new THREE.Mesh(tipGeo, bladeMat)
  tip.position.set(1.25, 0, 0)
  tip.scale.set(1, 1, 0.25)
  group.add(tip)

  // Silver handle
  const handleGeo = new THREE.BoxGeometry(0.8, 0.3, 0.15)
  const handleMat = new THREE.MeshStandardMaterial({ 
    color: 0xdddddd, 
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x999999,
    emissiveIntensity: 0.2
  })
  const handle = new THREE.Mesh(handleGeo, handleMat)
  handle.position.set(-1.65, 0, 0)
  handle.castShadow = true
  handle.receiveShadow = true
  group.add(handle)

  return group
}

function startWhirlpool(sceneRef, vortexRef, vortexStartRef, phaseRef) {
  phaseRef.current = 'whirlpool'
  vortexStartRef.current = Date.now()
  const vortex = createVortex()
  sceneRef.current.add(vortex)
  vortexRef.current = vortex
}

function createVortex() {
  const vortexGroup = new THREE.Group()
  
  // BEAUTIFUL SWIRLING VORTEX with smooth gradient
  const layers = 8
  const particlesPerLayer = 100
  
  for (let layer = 0; layer < layers; layer++) {
    const positions = new Float32Array(particlesPerLayer * 3)
    const colors = new Float32Array(particlesPerLayer * 3)
    const sizes = new Float32Array(particlesPerLayer)
    
    const radius = 5 - (layer * 0.5)
    const height = layer * 1.2 - 3
    
    // Color gradient from pink to purple to blue
    const hue = 0.8 + (layer / layers) * 0.2
    const color = new THREE.Color().setHSL(hue, 1, 0.6)
    
    for (let i = 0; i < particlesPerLayer; i++) {
      const angle = (i / particlesPerLayer) * Math.PI * 2
      const r = radius + Math.sin(i * 0.5) * 0.3
      
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = height + Math.sin(i * 0.3) * 0.2
      positions[i * 3 + 2] = Math.sin(angle) * r
      
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      
      sizes[i] = 0.3 + Math.random() * 0.2
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })
    
    const points = new THREE.Points(geometry, material)
    points.userData.rotationSpeed = 0.5 + layer * 0.2
    points.userData.layer = layer
    vortexGroup.add(points)
  }
  
  // Glowing center tunnel
  const tunnelGeo = new THREE.CylinderGeometry(0.3, 1.5, 10, 32, 1, true)
  const tunnelMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })
  const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat)
  tunnel.position.y = 0
  vortexGroup.add(tunnel)
  
  // Bright core light
  const coreLight = new THREE.PointLight(0xff00ff, 5, 20)
  coreLight.position.set(0, 0, 0)
  vortexGroup.add(coreLight)
  
  vortexGroup.position.y = 0
  return vortexGroup
}

function createNotes(scene, notesRef) {
  if (notesRef.current && notesRef.current.length) return
  const notes = new THREE.Group()
  const messages = [
    'Dear Kareena,\nyou make every\nday brighter! ✨',
    'Your smile is\nmy favorite view\nin the world! 💖',
    'May this year be\nas amazing as\nyou are! 🎉',
    'Happy Birthday\nto the most\nwonderful person! 🎂',
    'Wishing you joy,\nlove, and endless\nhappiness! 🌟',
    'You deserve all\nthe best things\nin life! 🎈'
  ]
  
  // Position notes in a circle around the viewer
  messages.forEach((msg, i) => {
    const angle = (i / messages.length) * Math.PI * 2
    const radius = 2.5
    const note = createNote3D(msg, i)
    note.position.set(
      Math.cos(angle) * radius,
      -0.5 + Math.sin(i * 1.3) * 1.5,
      Math.sin(angle) * radius
    )
    note.rotation.y = angle + Math.PI
    note.userData.floatOffset = i * Math.PI / 3
    note.userData.floatSpeed = 0.8 + Math.random() * 0.4
    notes.add(note)
  })
  
  scene.add(notes)
  notesRef.current = [notes]
  
  // Animate notes
  // Notes stay still - no animation for better readability
  // const animateNotes = () => {
  //   if (notes.parent) {
  //     const time = Date.now() * 0.001
  //     notes.children.forEach((note) => {
  //       const float = Math.sin(time * note.userData.floatSpeed + note.userData.floatOffset) * 0.1
  //       note.position.y += float * 0.01
  //       note.rotation.x = Math.sin(time * 0.5 + note.userData.floatOffset) * 0.08
  //       note.rotation.z = Math.cos(time * 0.3 + note.userData.floatOffset) * 0.05
  //     })
  //     requestAnimationFrame(animateNotes)
  //   }
  // }
  // animateNotes()
}

function createNote3D(text, index) {
  const group = new THREE.Group()
  
  // Create 3D note card
  const cardWidth = 1.2
  const cardHeight = 1.0
  const cardDepth = 0.05
  
  // Card body
  const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth)
  const cardMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffacd,
    roughness: 0.6,
    metalness: 0.1
  })
  const card = new THREE.Mesh(cardGeometry, cardMaterial)
  card.castShadow = true
  card.receiveShadow = true
  group.add(card)
  
  // Text on card
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  
  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#fffef0')
  gradient.addColorStop(1, '#fff8dc')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Border
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)
  
  // Text - larger and more visible
  ctx.fillStyle = '#2c1810'
  ctx.font = 'bold 48px "Gloria Hallelujah", cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const lines = text.split('\n')
  const lineHeight = 65
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2
  
  lines.forEach((line, i) => {
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight)
  })
  
  const texture = new THREE.CanvasTexture(canvas)
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  })
  
  const textPlane = new THREE.PlaneGeometry(cardWidth * 0.95, cardHeight * 0.95)
  const textMesh = new THREE.Mesh(textPlane, textMaterial)
  textMesh.position.z = cardDepth / 2 + 0.01
  group.add(textMesh)
  
  // Decorative corners
  const colors = [0xff69b4, 0x87ceeb, 0x98fb98, 0xffd700, 0xff6347, 0xda70d6]
  const cornerColor = colors[index % colors.length]
  
  const cornerGeometry = new THREE.SphereGeometry(0.06, 8, 8)
  const cornerMaterial = new THREE.MeshStandardMaterial({
    color: cornerColor,
    emissive: cornerColor,
    emissiveIntensity: 0.5,
    metalness: 0.6,
    roughness: 0.3
  })
  
  const corners = [
    [-cardWidth/2 + 0.1, cardHeight/2 - 0.1],
    [cardWidth/2 - 0.1, cardHeight/2 - 0.1],
    [-cardWidth/2 + 0.1, -cardHeight/2 + 0.1],
    [cardWidth/2 - 0.1, -cardHeight/2 + 0.1]
  ]
  
  corners.forEach(([x, y]) => {
    const corner = new THREE.Mesh(cornerGeometry, cornerMaterial)
    corner.position.set(x, y, cardDepth / 2 + 0.03)
    group.add(corner)
  })
  
  // Glow effect
  const glowGeometry = new THREE.PlaneGeometry(cardWidth * 1.1, cardHeight * 1.1)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: cornerColor,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.position.z = -cardDepth / 2 - 0.01
  group.add(glow)
  
  return group
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  const lines = []
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line)
      line = words[n] + ' '
    } else {
      line = testLine
    }
  }
  lines.push(line)
  const startY = y - (lines.length - 1) * (lineHeight / 2)
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight))
}

function createBalloons(scene) {
  // Create aesthetic floating balloons
  const balloonColors = [0xff69b4, 0x87ceeb, 0xffd700, 0xff6347, 0x98fb98, 0xda70d6]
  const balloonCount = 12
  
  for (let i = 0; i < balloonCount; i++) {
    const balloonGroup = new THREE.Group()
    
    // Balloon body
    const balloonGeo = new THREE.SphereGeometry(0.3, 16, 16)
    balloonGeo.scale(1, 1.3, 1) // Elongate
    const balloonMat = new THREE.MeshStandardMaterial({
      color: balloonColors[i % balloonColors.length],
      emissive: balloonColors[i % balloonColors.length],
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.1
    })
    const balloon = new THREE.Mesh(balloonGeo, balloonMat)
    balloonGroup.add(balloon)
    
    // Balloon knot
    const knotGeo = new THREE.SphereGeometry(0.05, 8, 8)
    const knotMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
    const knot = new THREE.Mesh(knotGeo, knotMat)
    knot.position.y = -0.4
    balloonGroup.add(knot)
    
    // String
    const stringGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 4)
    const stringMat = new THREE.MeshBasicMaterial({ color: 0x666666 })
    const string = new THREE.Mesh(stringGeo, stringMat)
    string.position.y = -1.15
    balloonGroup.add(string)
    
    // Position balloons around the scene
    const angle = (i / balloonCount) * Math.PI * 2
    const radius = 6 + Math.random() * 2
    balloonGroup.position.set(
      Math.cos(angle) * radius,
      -3 + Math.random() * 2,
      Math.sin(angle) * radius
    )
    
    scene.add(balloonGroup)
    
    // Animate balloons floating up
    const startTime = Date.now()
    const duration = 8000 + Math.random() * 4000
    const floatSpeed = 0.3 + Math.random() * 0.2
    
    const animateBalloon = () => {
      const elapsed = Date.now() - startTime
      if (elapsed < duration && balloonGroup.parent) {
        balloonGroup.position.y += floatSpeed * 0.016
        balloonGroup.rotation.z = Math.sin(elapsed * 0.001) * 0.1
        requestAnimationFrame(animateBalloon)
      } else if (balloonGroup.parent) {
        scene.remove(balloonGroup)
      }
    }
    
    setTimeout(() => animateBalloon(), i * 100)
  }
}

function createConfetti(scene) {
  // Create aesthetic confetti particles
  const confettiCount = 150
  const confettiColors = [0xff69b4, 0xffd700, 0x87ceeb, 0xff6347, 0x98fb98, 0xda70d6, 0xffa500]
  
  for (let i = 0; i < confettiCount; i++) {
    const confettiGeo = new THREE.PlaneGeometry(0.1, 0.15)
    const confettiMat = new THREE.MeshBasicMaterial({
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    })
    const confetti = new THREE.Mesh(confettiGeo, confettiMat)
    
    // Start position - above and around
    confetti.position.set(
      (Math.random() - 0.5) * 12,
      8 + Math.random() * 3,
      (Math.random() - 0.5) * 12
    )
    
    confetti.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )
    
    scene.add(confetti)
    
    // Animate confetti falling
    const velocity = {
      x: (Math.random() - 0.5) * 0.02,
      y: -(0.03 + Math.random() * 0.02),
      z: (Math.random() - 0.5) * 0.02
    }
    
    const rotationSpeed = {
      x: (Math.random() - 0.5) * 0.1,
      y: (Math.random() - 0.5) * 0.1,
      z: (Math.random() - 0.5) * 0.1
    }
    
    const startTime = Date.now()
    const duration = 6000
    
    const animateConfetti = () => {
      const elapsed = Date.now() - startTime
      if (elapsed < duration && confetti.parent) {
        confetti.position.x += velocity.x
        confetti.position.y += velocity.y
        confetti.position.z += velocity.z
        
        confetti.rotation.x += rotationSpeed.x
        confetti.rotation.y += rotationSpeed.y
        confetti.rotation.z += rotationSpeed.z
        
        // Fade out near the end
        if (elapsed > duration * 0.7) {
          confetti.material.opacity = 0.9 * (1 - (elapsed - duration * 0.7) / (duration * 0.3))
        }
        
        requestAnimationFrame(animateConfetti)
      } else if (confetti.parent) {
        scene.remove(confetti)
      }
    }
    
    setTimeout(() => animateConfetti(), i * 10)
  }
}

export default BirthdayScene

