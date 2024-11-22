const fastify = require('fastify')({ logger: true });
const fastifyMongo = require('fastify-mongodb');
const cors = require('@fastify/cors');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

// MongoDB Connection
fastify.register(fastifyMongo, {
  url: 'mongodb://localhost:27017/comall', // Replace with your MongoDB URI
  forceClose: true, // Ensures MongoDB connection is closed on Fastify exit
});

// CORS for Cross-Origin Requests
fastify.register(cors, {
  origin: true, // Allow all origins; customize for production
});

// Signup Route
fastify.post('/comall/user-signup', async (request, reply) => {
  const { name, username, email, mobile, password } = request.body;

  if (!name || !username || !email || !mobile || !password) {
    return reply.status(400).send({ error: 'All fields are required!' });
  }

  const collection = fastify.mongo.db.collection('users');

  try {
    // Check if username or email already exists
    const existingUser = await collection.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return reply.status(409).send({ error: 'Username or email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      username,
      email,
      mobile,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(userData);

    reply.send({
      success: true,
      message: 'User successfully registered!',
      userId: result.insertedId,
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to store user data' });
  }
});

// Login Route
fastify.post('/comall/user-login', async (request, reply) => {
  const { usernameOrEmail, password } = request.body;

  if (!usernameOrEmail || !password) {
    reply.status(400).send({ error: 'Both username/email and password are required.' });
    return;
  }

  const collection = fastify.mongo.db.collection('users');

  try {
    // Find the user by username or email
    const user = await collection.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    });

    if (!user) {
      reply.status(404).send({ error: 'User not found.' });
      return;
    }

    // Compare the hashed password with the provided password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      reply.status(401).send({ error: 'Invalid credentials.' });
      return;
    }

    reply.send({
      success: true,
      message: 'Login successful!',
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to login user.' });
  }
});

// Get Users Data

fastify.get('/comall/users', async (request, reply) => {
    try {
      const collection = fastify.mongo.db.collection('users');
      const users = await collection.find({}).toArray();
  
      reply.send({
        success: true,
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          username: user.username,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch users.' });
    }
  });

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 433 });
    fastify.log.info(`Server is running on http://localhost:433`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
