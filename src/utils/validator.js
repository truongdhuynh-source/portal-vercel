export const validatorPassword = (password) => {
  const regExp = /^[^\s\uD800-\uDFFF]+$/g;

  const validPassword = regExp.test(password);
  return validPassword;
};

export const validatorOnlyNumber = (number) => {
  const regExp = /^\d+$/;

  const validNumber = regExp.test(number);
  return validNumber;
};

export const validatorInputNumber = (event) => {
  if (!validatorOnlyNumber(event.key) && event.which !== 8) {
    event.preventDefault();
  }
};

export const blockSpace = (event) => {
  if (event.which === 32) {
    event.preventDefault();
  }
};

export const validatorPhoneNumber = (number) => {
  const regexPhoneNumber = /^0\d{9}$/;

  const validNumber = regexPhoneNumber.test(number);
  return validNumber;
};

export const inputPhoneNumber = (event) => {
  const regex = /^[0-9]+$/;

  if (!regex.test(event.key) && event.which !== 8 && event.which !== 46) {
    event.preventDefault();
  }
};
