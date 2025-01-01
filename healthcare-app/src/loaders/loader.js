import DataLoader from 'dataloader';
import User from '../models/User.js';

// ✅ Batch Function for Users
const batchUsers = async (userIds) => {
  console.log('🔄 Fetching Users in Batch:', userIds);
  
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = users.reduce((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  return userIds.map((id) => userMap[id.toString()] || null);
};

// ✅ Create DataLoaders
export const createLoaders = () => ({
  userLoader: new DataLoader(batchUsers),
});
