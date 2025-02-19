export const getTimeDifferenceMinutes = (lastLoginTime) => {
	const now = new Date();
	const lastLoginDate = new Date(lastLoginTime);

	const timeDifferenceMilliseconds = now.getTime() - lastLoginDate.getTime();
	const timeDifferenceMinutes = Math.round(timeDifferenceMilliseconds / (1000 * 60));

	 if (timeDifferenceMinutes === 0) {
		return "Less than a minute ago"
	 } else {
		 return `${timeDifferenceMinutes} minutes ago`;
	}
};

export function createRoomId(str1, str2) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 월은 0부터 시작하므로 +1
    const day = currentDate.getDate();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();

    const result = `${year}-${month}-${day}-${hours}${minutes}` + "-" + str1 + "-"  + str2;
    return result;
}