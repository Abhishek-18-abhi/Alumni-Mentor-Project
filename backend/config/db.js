import mongoose from 'mongoose';

let cachedPromise = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (mongoose.connection.readyState === 2 && cachedPromise) {
    return cachedPromise;
  }

  cachedPromise = mongoose
    .connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
    .then((m) => {
      console.log(`MongoDB connected: ${mongoose.connection.name}`);
      return m;
    })
    .catch((err) => {
      cachedPromise = null;
      throw err;
    });

  return cachedPromise;
}
