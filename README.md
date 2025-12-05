# Happy Birthday Kareena! 🎂

A beautiful, interactive React + Three.js birthday experience with:
- 🎂 Extravagant 3D cake with interactive candles
- 🎆 Diwali-style fireworks display
- 📸 3D photo diary
- ✨ Step-based interactive experience
- ⚡ Optimized with React and Vite for fast performance

## Features

1. **Step 1: Cake View**
   - Beautiful 3-tier cake with decorations
   - 7 interactive candles
   - Click candles to blow them out
   - Smooth animations and effects

2. **Step 2: Fireworks**
   - Diwali-style sky shots
   - "Happy Birthday Kareena" message
   - Multiple colorful explosions

3. **Step 3: Photo Diary**
   - 3D rotating photo frames
   - Click photos to focus
   - Interactive exploration

## Performance Optimizations

- Built with React + Vite for fast development and optimized builds
- Reduced geometry complexity for better performance
- Optimized shadow maps and pixel ratios
- Efficient animation loops with React hooks
- Proper cleanup and memory management

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

The app will open automatically at `http://localhost:3000`

## Adding Photos

To add actual photos of Kareena:

1. Create a `public/photos` folder
2. Add your photos (jpg, png, etc.) to the folder
3. Open `src/components/BirthdayScene.jsx`
4. Find the `createPhotoFrame` function and modify it to load textures:

```javascript
// In createPhotoFrame function, replace the placeholder material:
const loader = new THREE.TextureLoader()
loader.load(`/photos/kareena${index + 1}.jpg`, (texture) => {
  photoMaterial.map = texture
  photoMaterial.needsUpdate = true
})
```

Or add a helper function after creating the photo diary:

```javascript
// After creating photo diary in useEffect
const photoPaths = [
  '/photos/kareena1.jpg',
  '/photos/kareena2.jpg',
  '/photos/kareena3.jpg',
  '/photos/kareena4.jpg',
  '/photos/kareena5.jpg',
  '/photos/kareena6.jpg'
]

photosRef.current.forEach((photo, index) => {
  if (photoPaths[index]) {
    const loader = new THREE.TextureLoader()
    loader.load(photoPaths[index], (texture) => {
      photo.userData.photoMaterial.map = texture
      photo.userData.photoMaterial.needsUpdate = true
    })
  }
})
```

## Customization

- **Change colors:** Modify color values in `createCake()` function
- **Add more candles:** Change `candleCount` in `addCandles()` function
- **Adjust fireworks:** Modify `fireworkCount` in `startFireworks()` function
- **Change birthday message:** Edit the text in `src/components/StepOverlay.jsx`

## Browser Requirements

- Modern browser with WebGL support
- Chrome, Firefox, Safari, or Edge (latest versions)

## Tech Stack

- React 18
- Three.js
- Vite
- OrbitControls

Enjoy creating this special birthday surprise! 🎂✨
