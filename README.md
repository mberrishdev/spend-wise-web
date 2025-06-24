# SpendWise

A Firebase-powered, privacy-first personal finance tracker built with React, Vite, and TailwindCSS.

## 🚀 Quickstart

1. **Clone the repo:**
   ```sh
   git clone https://github.com/mberrishdev/spend-wise.git
   cd spend-wise
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up Firebase credentials:**
   - Create a `.env` file in the project root (see below).
   - **Never commit your `.env` file!**

4. **Run the app:**
   ```sh
   npm run dev
   ```

## 🔑 Firebase Environment Variables

Create a `.env` file in your project root with the following:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

- You can find these values in your Firebase Console under Project Settings > General.
- **Do not commit your `.env` file to version control.**

## 🛡️ Security
- All user data is stored in Firestore under their own UID.
- Firestore security rules should restrict access to authenticated users only.

## 🧩 Features
- Google Sign-In authentication
- User-specific data (expenses, categories, monthly plan)
- All data stored in Firebase Firestore
- Modern UI with TailwindCSS

---

MIT License

## ❤️ Made with

SpendWise is crafted with care by [Vibe Coding](https://vibecoding.com), using [Lovable](https://lovable.so) and [Cursor](https://cursor.so) for a delightful developer experience.
