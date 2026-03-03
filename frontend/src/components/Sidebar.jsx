
function Sidebar({ users, onSelectUser, selectedUser }) {
    return (
      <div className="sidebar">
        <h3 className="sidebar-title" >Messages</h3>       
  
        {users.map((user) => (
          <div
            key={user.id}
            className={`user-item ${
              selectedUser?.id === user.id ? "active" : ""
            }`}
            onClick={() => onSelectUser(user)}
          >
            <div className="user-info">
              <h4>{user.name}</h4>
              <p>{user.lastMessage}</p>
            </div>
  
            {user.unread > 0 && (
              <span className="unread-badge">{user.unread}</span>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  export default Sidebar;