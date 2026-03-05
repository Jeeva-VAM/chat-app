import apiService from "../../services/api";

const PAGE_SIZE = 5;

export async function fetchSuggestedUsers(cursor = 0, currentUserId = null) {
  try {
    const page = Math.floor(cursor / PAGE_SIZE) + 1;
    
    // Prepare API parameters
    const params = {
      page: page,
      limit: PAGE_SIZE
    };
    
    // Add exclude parameter if current user ID is provided
    if (currentUserId) {
      params.exclude = currentUserId;
    }
    
    const response = await apiService.getSuggestedUsers(params);
    
    const users = response.profiles || [];
    
    // Additional frontend filter as backup (in case backend doesn't filter properly)
    const filteredUsers = users.filter(profile => {
      const profileId = profile.userId || profile._id;
      return profileId !== currentUserId;
    });
    
    const formattedUsers = filteredUsers.map(profile => ({
      id: profile.userId || profile._id,
      name: profile.name,
      email: profile.email,
      picture: profile.profileImage || profile.picture,
      bio: profile.bio || ''
    }));

    // Remove any duplicate users based on ID (additional safety check)
    const uniqueUsers = formattedUsers.filter((user, index, array) => 
      array.findIndex(u => u.id === user.id) === index
    );

    console.log(`Fetched ${uniqueUsers.length} unique users from MongoDB (page: ${page}, cursor: ${cursor}), excluded current user: ${currentUserId}`);

    return {
      users: uniqueUsers,
      nextCursor: uniqueUsers.length === PAGE_SIZE ? cursor + PAGE_SIZE : undefined
    };
  } catch (error) {
    console.error('Failed to fetch suggested users from MongoDB:', error);
    
    return {
      users: [],
      nextCursor: undefined
    };
  }
}