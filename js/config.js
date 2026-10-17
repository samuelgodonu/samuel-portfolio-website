// ------------------------------------------------------------
// SITE CONFIGURATION
// The site works without any of this (it reads the /data/*.json files).
// Fill these in later to switch on the dashboard, database and image uploads.
// ------------------------------------------------------------

// Firebase console > Project settings > General > Your apps > Web app > Config
export const firebaseConfig = {
  apiKey: "AIzaSyAjupY7GFY-nThobwTAevGh0v_Z4DrZtno",
  authDomain: "samuel-portfolio-a8e4d.firebaseapp.com",
  projectId: "samuel-portfolio-a8e4d",
  storageBucket: "samuel-portfolio-a8e4d.firebasestorage.app",
  messagingSenderId: "848607249900",
  appId: "1:848607249900:web:0f34ecf963342c0405ecc9",
  measurementId: "G-0FNBVFCD44"
};

// Cloudinary > Settings > Upload > Upload presets > Add preset (Signing mode: Unsigned)
export const cloudinary = {
  cloudName: "senxztcj",
  uploadPreset: "portfolio"
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const cloudinaryEnabled = Boolean(cloudinary.cloudName && cloudinary.uploadPreset);
