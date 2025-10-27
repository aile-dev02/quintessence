# Firebase Setup Guide for TestMemo

## 🔥 Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., `testmemo-production`)
4. Enable/disable Google Analytics as needed
5. Click "Create project"

### 2. Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll set custom rules later)
4. Select your region (choose closest to your users)
5. Click "Done"

### 3. Configure Web App

1. Go to Project Settings (gear icon)
2. Click "Add app" → Web app icon
3. Enter app nickname (e.g., "TestMemo Web")
4. Check "Also set up Firebase Hosting" if desired
5. Click "Register app"
6. Copy the Firebase configuration object

### 4. Set Security Rules

1. Go to "Firestore Database" → "Rules"
2. Replace the rules with content from `firestore.rules`
3. Click "Publish"

Example rules for public access (demo):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /memos/{memoId} {
      allow read, write: if true; // Public access for demo
    }
  }
}
```

### 5. Configure Environment Variables

#### For Vercel Deployment:

In your Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add these variables with your **actual Firebase project values**:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_FIREBASE_PROJECT_ID` | your-actual-project-id | Production |
| `VITE_FIREBASE_API_KEY` | your-actual-api-key | Production |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-actual-project-id.firebaseapp.com | Production |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-actual-project-id.appspot.com | Production |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your-actual-messaging-sender-id | Production |
| `VITE_FIREBASE_APP_ID` | your-actual-app-id | Production |
| `VITE_USE_FIREBASE_EMULATOR` | false | Production |

#### For Local Production Testing:

1. Copy `.env.production.example` to `.env.production`
2. Fill in your actual Firebase project values
3. Test with: `npm run build && npm run preview`

**⚠️ Important**: Never use `testmemo-demo` values in production. This will cause connection errors.

### 6. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel --prod
```

## 🔒 Security Considerations

### Production Security Rules

For production use with authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all operations
    match /memos/{memoId} {
      allow read, write: if request.auth != null;
      
      // Optional: restrict to document owner
      // allow read, write: if request.auth != null && 
      //   request.auth.uid == resource.data.createdBy;
    }
  }
}
```

### Environment Variables Security

- Never commit actual Firebase config to git
- Use Vercel's environment variables for production
- Different Firebase projects for staging/production
- Regular rotation of API keys

## 🧪 Testing Firebase Integration

### Local Testing

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize project:
```bash
firebase init firestore
```

4. Start local emulator:
```bash
firebase emulators:start --only firestore
```

5. Set environment variable:
```bash
VITE_USE_FIREBASE_EMULATOR=true npm run dev
```

### Production Testing

1. Deploy with correct environment variables
2. Test memo creation/editing/deletion
3. Verify real-time sync between multiple browser tabs
4. Check Firebase Console for data persistence
5. Monitor Firebase usage and performance

## 🚨 Troubleshooting

### Common Issues

**`testmemo-demo` connection errors in production**:
- **Cause**: Using demo/fallback Firebase config in production
- **Solution**: Set proper environment variables with your actual Firebase project values
- **Check**: Ensure `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_API_KEY` are set

**Firebase not initializing**:
- Check environment variables are set correctly in Vercel dashboard
- Verify Firebase project exists and is active  
- Check browser console for detailed error messages
- Ensure all required environment variables are set (not just some)

**Permission denied (401) errors**:
- Check if your Firebase API key is correct
- Verify your Firebase project ID matches the one in Firebase Console
- Ensure the web app is properly configured in Firebase project settings

**Bad Request (400) errors**:
- Usually indicates incorrect Firebase configuration
- Double-check all environment variable values
- Make sure you're not using demo values in production

**Real-time updates not working**:
- Check network connectivity
- Verify Firestore rules allow read access
- Test in incognito mode to rule out caching issues

### Debugging Commands

```bash
# Check environment variables (local)
echo $VITE_FIREBASE_PROJECT_ID

# Check Vercel environment variables
vercel env ls

# Test Firebase connection
firebase projects:list

# Check Firestore rules
firebase firestore:rules:get
```

## 🚨 Emergency Fix for Production

If your production site is currently broken due to Firebase errors:

### Quick Fix Steps:

1. **Immediately disable Firebase** by setting this in Vercel:
   ```
   VITE_FIREBASE_PROJECT_ID = (leave empty or delete)
   ```

2. **Or remove all Firebase environment variables** temporarily

3. **Redeploy** - the app will run in local-storage-only mode

4. **Then properly configure Firebase** using the steps above

### Verify Fix:
- Check browser console - no more `testmemo-demo` or Firebase errors
- App should work with local storage only
- Memos are saved locally in browser

## 📊 Monitoring & Analytics

### Firebase Analytics

1. Enable Analytics in Firebase Console
2. Add Analytics to your web app
3. Configure custom events for memo actions
4. Monitor usage patterns and performance

### Performance Monitoring

1. Enable Performance Monitoring in Firebase Console
2. Monitor app startup time and user interactions
3. Track Firestore operation performance
4. Set up alerts for performance degradation