export const userListConvertForShareFile = (users: any[]) => {
  return users.map(user => ({
    id: user.id,
    name: user.fullName || user.firstName + " " + user.lastName || user.email,
    email: user.email
  }));
};

export const userConvertForShareFile = (user: any) => {
  return {
    id: user.id,
    name: user.fullName || user.firstName + " " + user.lastName || user.email,
    email: user.email
  };
}