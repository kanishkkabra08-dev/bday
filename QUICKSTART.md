# Quick Start Guide

## Getting Started

1. **Open the website:**
   - Simply open `index.html` in a modern web browser
   - Or run `npm start` and visit `http://localhost:3000`

2. **The Experience:**
   - **Step 1:** A beautiful 3D cake appears with 7 candles
   - **Step 2:** Click each candle to blow it out
   - **Step 3:** After all candles are blown, fireworks display with "Happy Birthday Kareena!"
   - **Step 4:** Explore the 3D photo diary by clicking on photos

## Adding Photos

To add photos of Kareena:

1. Create a `photos` folder in the project directory
2. Add your photos (jpg, png, etc.) to the folder
3. Open `main.js` and find the commented section at the bottom
4. Uncomment and update the photo paths:

```javascript
setTimeout(() => {
    const photoPaths = [
        'photos/kareena1.jpg',
        'photos/kareena2.jpg',
        'photos/kareena3.jpg',
        'photos/kareena4.jpg',
        'photos/kareena5.jpg',
        'photos/kareena6.jpg'
    ];
    photoPaths.forEach((path, index) => {
        window.birthdayExperience.loadPhotoIntoFrame(index, path);
    });
}, 3000);
```

5. Replace the paths with your actual photo filenames
6. Adjust the number of photos (currently 6) by modifying `photoCount` in `createPhotoDiary()`

## Customization Tips

- **Change colors:** Modify color values in `createCake()` method
- **Add more candles:** Change `candleCount` in `addCandles()` method
- **Adjust fireworks:** Modify `fireworkCount` in `startFireworks()` method
- **Change birthday message:** Edit the text in `index.html` (step2 section)

## Browser Requirements

- Modern browser with WebGL support
- Chrome, Firefox, Safari, or Edge (latest versions)

Enjoy creating this special birthday surprise! 🎂✨

