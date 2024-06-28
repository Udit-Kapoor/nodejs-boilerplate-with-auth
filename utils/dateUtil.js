// use this to remove 12 hours from time to sync with our script as it starts at 12 pm
function getLocalDate() {
  // Create a new Date object for the current date and time
  const currentDate = new Date();

  // currentDate.setHours(currentDate.getHours() - 12);
  currentDate.setHours(5, 30, 0, 0);

  const timeZoneOffsetInMinutes = -new Date().getTimezoneOffset();
  // console.log(currentDate)
  // console.log(timeZoneOffsetInMinutes)

  // Adjust the current date and time based on the time zone offset
  const currentDateInIndia = new Date(
    currentDate.getTime() + timeZoneOffsetInMinutes * 60000
  );

  return currentDate;
}

function getLocalDateNOW() {
  // Create a new Date object for the current date and time
  const currentDate = new Date();
  currentDate.setHours(5, 30, 0, 0);

  const timeZoneOffsetInMinutes = -new Date().getTimezoneOffset();
  // console.log(currentDate)
  // console.log(timeZoneOffsetInMinutes)

  // Adjust the current date and time based on the time zone offset
  const currentDateInIndia = new Date(
    currentDate.getTime() + timeZoneOffsetInMinutes * 60000
  );

  return currentDate;
}

// use this for data pulling
function getCorrectedDate(date = date.now()) {
  // Create a new Date object for the current date and time
  const currentDate = new Date(date);

  // currentDate.setHours(currentDate.getHours() - 12);
  currentDate.setHours(5, 30, 0, 0);

  const timeZoneOffsetInMinutes = -new Date().getTimezoneOffset();
  // console.log(currentDate)
  // console.log(timeZoneOffsetInMinutes)

  // Adjust the current date and time based on the time zone offset
  const currentDateInIndia = new Date(
    currentDate.getTime() + timeZoneOffsetInMinutes * 60000
  );

  return currentDate;
}

function getOlderDate(time) {
  const localDate = getLocalDate();
  const otherDate = getLocalDate();

  switch (time) {
    case '24h':
      return new Date(otherDate.setDate(localDate.getDate() - 1));
    case '30d':
      return new Date(otherDate.setDate(localDate.getDate() - 30));
    case '60d':
      return new Date(otherDate.setDate(localDate.getDate() - 60));
    case '90d':
      return new Date(otherDate.setDate(localDate.getDate() - 90));
    case '120d':
      return new Date(otherDate.setDate(localDate.getDate() - 120));
    // fudge values to avoid infinity
    case '365d':
      return new Date(otherDate.setDate(localDate.getDate() - 362));
    case '395d':
      return new Date(otherDate.setDate(localDate.getDate() - 392));
    default:
    case 'latest':
      return localDate;
  }
}

function dateFormatter() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

module.exports = {
  getLocalDate,
  getOlderDate,
  getCorrectedDate,
  getLocalDateNOW,
  dateFormatter,
};
