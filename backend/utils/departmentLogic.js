const DEFAULT_CHANNELS = [
  { name: '#General', slug: 'general', type: 'default', isDefault: true },
  { name: '#Tech', slug: 'tech', type: 'department', department: 'Tech', isDefault: true },
  { name: '#Marketing', slug: 'marketing', type: 'department', department: 'Marketing', isDefault: true },
  { name: '#Finance', slug: 'finance', type: 'department', department: 'Finance', isDefault: true },
  { name: '#Directors', slug: 'directors', type: 'directors', isDefault: true },
  { name: '#HR', slug: 'hr', type: 'department', department: 'HR', isDefault: true }
];

export const getDefaultChannels = () => DEFAULT_CHANNELS;

export const getChannelsForDepartment = (department) => {
  const channels = ['general'];
  
  if (department === 'Admin') {
    return ['general', 'tech', 'marketing', 'finance', 'directors', 'hr'];
  }
  
  if (department === 'Directors') {
    channels.push('directors');
  }
  
  const deptMap = {
    'Tech': 'tech',
    'Marketing': 'marketing',
    'Finance': 'finance',
    'HR': 'hr'
  };
  
  if (deptMap[department]) {
    channels.push(deptMap[department]);
  }
  
  return channels;
};

export const canAccessChannel = (user, channel) => {
  if (channel.type === 'directors') {
    return user.department === 'Admin' || user.department === 'Directors' || user.roles?.isDirector;
  }
  
  if (channel.type === 'department') {
    return user.department === 'Admin' || user.department === channel.department;
  }
  
  return true;
};
