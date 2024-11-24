import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./dashboard.css";

function Dashboard() {
  const [allUsers, setAllUsers] = useState([]); // State to store all users
  const [myFriends, setMyFriends] = useState([]); // State to store my friends
  const [searchTerm, setSearchTerm] = useState(""); // State to filter users by search term
  const [viewMode, setViewMode] = useState("all"); // View mode: 'all', 'friends', or 'pending'
  const [pendingRequests, setPendingRequests] = useState([]); // State for pending friend requests
  const [selectedFriend, setSelectedFriend] = useState(null); // State for the selected friend
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const chatWindowRef = useRef(null);

  // Get current logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const currentUserId = currentUser?.userId || null;
  const currentUsername = currentUser?.username || "Guest";

  console.log(currentUserId);

  // Function to fetch all users
  const fetchAllUsers = async () => {
    try {
      const response = await fetch("http://localhost:433/comall/users"); // API endpoint to fetch all users
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setAllUsers(data.users); // Store fetched users in state
      console.log(data.users);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  // Function to fetch friends from the backend
  const fetchMyFriends = async () => {
    try {
      const response = await fetch(
        `http://localhost:433/comall/myfriends?userId=${currentUserId}`
      ); // API endpoint to fetch my friends
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      const data = await response.json();
      console.log(data);
      setMyFriends(data.friends); // Store fetched friends in state
    } catch (error) {
      console.error("Error fetching my friends:", error);
    }
  };

  // Function to fetch pending friend requests
  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(
        `http://localhost:433/comall/pending-friend-requests?userId=${currentUserId}`
      );
      const data = await response.json();

      if (data.success) {
        console.log(data.requests); // Log the requests to check the data structure
        setPendingRequests(data.requests); // Store pending requests in state
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  // Function to send a friend request
  const handleSendFriendRequest = async (toUserId) => {
    if (!currentUserId) {
      console.error("User not logged in");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:433/comall/send-friend-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromUserId: currentUserId,
            toUserId: toUserId,
          }),
        }
      );

      if (response.ok) {
        alert(`Friend request sent! from ${currentUserId} to ${toUserId}`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcceptRequest = async (friendUserId, currentUserId) => {
    try {
      const response = await fetch(
        `http://localhost:433/comall/accept-friend-request?friendUserId=${friendUserId}&userId=${currentUserId}`,
        {
          method: "GET", // Use GET since query params are being passed
        }
      );

      if (response.ok) {
        alert("Friend request accepted");
        console.log(response);
        fetchPendingRequests(); // Refresh the pending requests list
        fetchMyFriends(); // Refresh the friends list
      } else {
        const data = await response.json();
        alert(data.message || "Failed to accept request");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  // Function to reject a friend request
  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(
        "http://localhost:433/comall/reject-friend-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestId }),
        }
      );

      if (response.ok) {
        alert("Friend request rejected");
        fetchPendingRequests(); // Refresh the pending requests list
      } else {
        throw new Error("Failed to reject request");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchAllUsers();
    fetchMyFriends(); // Fetch friends list
    fetchPendingRequests(); // Fetch pending requests
  }, [currentUserId]);

  useEffect(() => {
    const socket = io("http://localhost:8080"); // Connect to the Socket.IO server
    setSocket(socket);

    // Register the user when the connection is established
    socket.emit("register", currentUserId);

    // Listen for incoming messages
    socket.on("chat", (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: data.from, content: data.content },
      ]);
    });

    // Cleanup when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, [currentUserId]);

  // Send message to selected friend
  const sendMessage = () => {
    if (socket && messageInput && selectedFriend) {
      const message = {
        fromUserId: currentUserId,
        toUserId: selectedFriend._id,
        content: messageInput,
      };
      socket.emit("chat", message); // Emit chat event
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: currentUserId, content: messageInput },
      ]);
      setMessageInput("");
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend); // Set selected friend for chat
  };

  // Filter out the logged-in user from the all users list
  const displayedUsers =
    viewMode === "all"
      ? allUsers.filter(
          (user) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
            user._id !== currentUserId && // Exclude the logged-in user
            !myFriends.some((friend) => friend._id === user._id) // Exclude friends
        )
      : viewMode === "friends"
      ? myFriends.filter((friend) =>
          friend.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : pendingRequests.filter(
          (request) =>
            request.fromUserId
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            request.toUserId.toLowerCase().includes(searchTerm.toLowerCase())
        );

  return (
    <div className="dashboard-container">
      <div className="header">
        <div className="logo">
          <p>comall.</p>
        </div>
        <div className="user-info">
          <p>Welcome, {currentUsername}</p>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="left-sidebar">
        {/* Buttons to toggle between views */}
        <div className="view-buttons">
          <button
            className={`toggle-btn ${viewMode === "all" ? "active" : ""}`}
            onClick={() => setViewMode("all")}
          >
            All Users
          </button>
          <button
            className={`toggle-btn ${viewMode === "friends" ? "active" : ""}`}
            onClick={() => setViewMode("friends")}
          >
            My Friends
          </button>
          <button
            className={`toggle-btn ${viewMode === "pending" ? "active" : ""}`}
            onClick={() => setViewMode("pending")}
          >
            Pending Requests
          </button>
          <input
            type="text"
            placeholder="Search for users"
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-bar"
          />
        </div>

        {/* Scrollable User List */}
        <div className="left-section">
          <ul className="friend-list">
            {viewMode === "all" &&
              displayedUsers.map((user) => (
                <li key={user._id} className="friend-item">
                  <div className="user-info">
                    <div className="details">
                      <p className="username">
                        <i className="fas fa-user-circle detail-icon"></i>
                        <span className="text">{user.username}</span>
                      </p>
                      <p className="email">
                        <i className="fas fa-envelope detail-icon"></i>
                        <span className="text">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Show "Add Friend" button if the user is not already a friend */}
                  {!myFriends.some((friend) => friend._id === user._id) && (
                    <button
                      className="add-friend-btn"
                      onClick={() => handleSendFriendRequest(user._id)}
                    >
                      Add Friend
                    </button>
                  )}
                </li>
              ))}

            {viewMode === "friends" && (
              <ul className="friend-list">
                {myFriends.length > 0 ? (
                  myFriends.map((friend) => (
                    <li key={friend._id} className="friend-item">
                      <div
                        className="user-info"
                        onClick={() => handleFriendClick(friend)}
                      >
                        <div className="details">
                          <p className="username">
                            <i className="fas fa-user-circle detail-icon"></i>
                            <span className="text">{friend.username}</span>
                          </p>
                          <p className="email">
                            <i className="fas fa-envelope detail-icon"></i>
                            <span className="text">{friend.email}</span>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <p>No friends found. Start adding some friends!</p>
                )}
              </ul>
            )}

            {viewMode === "pending" &&
              pendingRequests.map((request) => {
                // Determine the other user's ID (sender or receiver)
                const userId =
                  request.fromUserId === currentUserId
                    ? request.toUserId
                    : request.fromUserId;

                // Find user details from `allUsers` (ensure the user exists)
                const user = allUsers.find((user) => user._id === userId);

                return (
                  <li key={request._id} className="friend-item">
                    <div className="user-info">
                      <div className="details">
                        <p className="username">
                          <i className="fas fa-user-circle detail-icon"></i>
                          <span className="text">
                            {user?.username || "Unknown User"}
                          </span>
                        </p>
                        <p className="email">
                          <i className="fas fa-envelope detail-icon"></i>
                          <span className="text">
                            {user?.email || "No Email"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div>
                      {request.fromUserId === currentUserId ? (
                        <p>Request sent to {user?.username}</p>
                      ) : (
                        <div className="pending-buttons">
                          <p>Request from {user?.username}</p>
                          <button
                            onClick={() =>
                              handleAcceptRequest(
                                request.fromUserId,
                                currentUserId
                              )
                            }
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request._id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* Right section can contain other content */}
      <div className="right-section">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="user-info">
                <i className="fas fa-user-circle detail-icon"></i>
                <p className="username">{selectedFriend.username}</p>
                <p className="status">Online</p>
              </div>
              <div className="call-buttons">
                <button className="call-btn">
                  <i className="fas fa-phone-alt"></i>
                </button>
                <button className="video-btn">
                  <i className="fas fa-video"></i>
                </button>
              </div>
            </div>

            {/* Chat Window */}
            <div className="chat-window" ref={chatWindowRef}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={
                    msg.from === currentUserId
                      ? "message sent"
                      : "message received"
                  }
                >
                  <p>{msg.content}</p>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="message-input">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="chat-header">
            <p>Select a friend to start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
