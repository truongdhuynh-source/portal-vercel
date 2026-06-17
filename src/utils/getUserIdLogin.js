import { AUTH_USERS, USER_ID } from '../constants';

const getUserIdLogin = () => {
  const authUser = JSON.parse(localStorage.getItem(AUTH_USERS)) || [];
  return sessionStorage.getItem(USER_ID) || authUser[0]?.id;
};

export default getUserIdLogin;
