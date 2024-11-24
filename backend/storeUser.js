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
          _id: user._id.toString(),  // Convert ObjectId to string
          name: user.name,
          username: user.username,
          email: user.email
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch users.' });
    }
  });


  // Send Friend Request (Backend)
fastify.post('/comall/send-friend-request', async (request, reply) => {
  const { fromUserId, toUserId } = request.body;

  const collection = fastify.mongo.db.collection('friendRequests');

  try {
    // Check if the request already exists
    const existingRequest = await collection.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (existingRequest) {
      return reply.status(400).send({ error: 'Friend request already exists' });
    }

    await collection.insertOne({
      fromUserId: fromUserId,
      toUserId: toUserId,
      status: 'pending',
    });

    reply.send({ success: true, message: 'Friend request sent!' });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to send friend request' });
  }
});


// Get Pending Friend Requests (Backend)
fastify.get('/comall/pending-friend-requests', async (request, reply) => {
  const { userId } = request.query;  // Get userId from the query params

  if (!userId) {
    return reply.status(400).send({ error: 'User ID is required' });
  }

  const collection = fastify.mongo.db.collection('friendRequests');

  try {
    // Find the requests where the user is either the 'fromUserId' or 'toUserId' with status 'pending'
    const requests = await collection.find({
      $or: [
        { toUserId: userId, status: 'pending' }
      ],
    }).toArray();

    if (requests.length === 0) {
      return reply.send({ success: true, requests: [] }); // Return empty if no requests
    }

    // Map the results to the expected response structure
    reply.send({
      success: true,
      requests: requests.map((request) => ({
        _id: request._id.toString(),  // Convert ObjectId to string
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
        status: request.status,
      })),
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch friend requests' });
  }
});


// Accept Friend Requests (Backend)
fastify.get('/comall/accept-friend-request', async (request, reply) => {
  const { friendUserId, userId } = request.query; // Get userId and friendUserId from query params

  if (!friendUserId || !userId) {
    return reply.status(400).send({ error: 'Both userId and friendUserId are required' });
  }

  const { ObjectId } = require('mongodb');
  const usersCollection = fastify.mongo.db.collection('users'); // Main users collection
  const friendshipsCollection = fastify.mongo.db.collection('friendships'); // Single collection for all friendships
  const friendRequestsCollection = fastify.mongo.db.collection('friendRequests'); // Friend requests collection


  const _friendId = new ObjectId(friendUserId);
  const _userId = new ObjectId(userId);

  try {
    // Step 1: Verify that both users exist in the users collection
    const [currentUser, friendUser] = await Promise.all([
      usersCollection.findOne({ _id: _userId }),
      usersCollection.findOne({ _id: _friendId }),
    ]);

    if (!currentUser || !friendUser) {
      return reply.send({ success: false, message: 'One or both users not found' });
    }

     // Step 2: Update the status of the friend request to "accepted"
     const updateResult = await friendRequestsCollection.updateOne(
      {
        $or: [
          { fromUserId: friendUserId, toUserId: userId },
          { fromUserId: userId, toUserId: friendUserId },
        ],
        status: "pending", // Ensure we're only updating "pending" requests
      },
      {
        $set: { status: "accepted", acceptedAt: new Date() }, // Set status to "accepted"
      }
    );

    if (updateResult.modifiedCount === 0) {
      return reply.status(400).send({ success: false, message: "No pending friend request found to accept" });
    }
   
    // Step 3: Update or create the friendship for both users
    await Promise.all([
      // Add the friend to the user's friends list
      friendshipsCollection.updateOne(
        { _id: _userId }, // Query to find the user's document
        {
          $set: {
            [`friends.${friendUserId}`]: {
              _id: friendUser._id, // Friend's ObjectId
              name: friendUser.name,
              username: friendUser.username,
              email: friendUser.email,
              mobile: friendUser.mobile,
              createdAt: friendUser.createdAt,
              addedAt: new Date(), // Record the time the friendship was added
            },
          },
        },
        { upsert: true } // Create the document if it doesn't exist
      ),

      // Add the user to the friend's friends list
      friendshipsCollection.updateOne(
        { _id: _friendId }, // Query to find the friend's document
        {
          $set: {
            [`friends.${userId}`]: {
              _id: currentUser._id, // User's ObjectId
              name: currentUser.name,
              username: currentUser.username,
              email: currentUser.email,
              mobile: currentUser.mobile,
              createdAt: currentUser.createdAt,
              addedAt: new Date(), // Record the time the friendship was added
            },
          },
        },
        { upsert: true } // Create the document if it doesn't exist
      ),
    ]);


    // Step 4: Respond with success
    reply.send({
      success: true,
      message: `Friendship established between ${currentUser.username} and ${friendUser.username}.`,
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to accept friend request' });
  }
});


// User's Friend (Backend)
fastify.get('/comall/myfriends', async (request, reply) => {
  const { userId } = request.query; // User ID from query parameters

  if (!userId) {
    return reply.status(400).send({ error: 'User ID is required' });
  }

  const collection = fastify.mongo.db.collection('friendships'); // Access the "users" collection
  const ObjectId = require('mongodb').ObjectId;

  try {
    // Find the user document by their ID
    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user || !user.friends) {
      return reply.send({
        success: true,
        friends: [], // No friends found
      });
    }

    // Extract the friends' details into an array
    const friends = Object.values(user.friends).map(friend => ({
      _id: friend._id.toString(), // Convert ObjectId to string
      name: friend.name,
      username: friend.username,
      email: friend.email,
      mobile: friend.mobile,
      addedAt: friend.addedAt, // Optional: Include when they were added
    }));

    // Respond with the friends' list
    reply.send({
      success: true,
      friends,
    });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch friends' });
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
