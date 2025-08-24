// Authentication Configuration
// Change these credentials as needed

export const AUTH_CONFIG = {
  // Default login credentials
  DEFAULT_CREDENTIALS: {
    username: 'jayeshpatel',
    password: '8000544966'
  },
  
  // You can add more users here
  USERS: [
    {
      username: 'jayeshpatel',
      password: '8000544966',
      role: 'admin',
      name: 'Administrator'
    },
    // Add more users as needed
    // {
    //   username: 'staff',
    //   password: 'staff123',
    //   role: 'staff',
    //   name: 'Staff Member'
    // }
  ],
  
  // Session settings
  SESSION: {
    timeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    rememberMe: true
  }
}

// Function to get credentials (you can modify this to load from database or API)
export const getCredentials = () => {
  return AUTH_CONFIG.DEFAULT_CREDENTIALS
}

// Function to validate credentials
export const validateCredentials = (username, password) => {
  const user = AUTH_CONFIG.USERS.find(
    u => u.username === username && u.password === password
  )
  return user ? { success: true, user } : { success: false, error: 'Invalid credentials' }
}

// Function to update credentials (for admin use)
export const updateCredentials = (oldUsername, oldPassword, newUsername, newPassword) => {
  // This is a simple implementation - in production, you'd want to use a database
  console.log('Credentials updated:', { oldUsername, oldPassword, newUsername, newPassword })
  
  // You can implement actual credential storage here
  // For example, save to localStorage, database, or API
  
  return { success: true, message: 'Credentials updated successfully' }
}
