// 2024.Dec.13

// Glicko Algorithm
// - was invented by Mark Glickman in 1995 as an improvement on the Elo rating system and initially intended for the primary use as a chess rating system
// https://en.wikipedia.org/wiki/Glicko_rating_system

// A user has the following parameters:

// 1. RD(ratings deviation): A variable that represents how one's rating is evenly distrubted
// 2. TimeTo: Tells for how long the user has been absent(usually measured in month)
// 3. C: A constant which is based on the uncertainty of a player's skill over a certain amount of time. It can be derived from thorough data analysis, or estimated by considering the length of time that would have to pass before a player's rating deviation would grow to that of an unrated player.
// 4. Rating: The current rating of the user 

// user = {id, RD, timeTo, c, rating }

const RD = 350;
const q = Math.log(10) / 400;
const pi = Math.pi;

function getRD(user)
{
    if (user.timeTo < 1)
        return user.rd;
    return Math.min(RD, Math.sqrt(user.id ** 2 + user.c ** 2 * user.timeTo));
}

function getgRD(user)
{
    return 1 / Math.sqrt(1 + 3 * ((q * user.RD / pi) ** 2));
}

function getERD(user, rating)
{
    return 1 / (1 + 10 ** (getgRD(user) * (rating - user.rating) / -400));
}

function calculateD2(rating, opponents)
{
    let sum = 0;
    for (const opp of opponents) {
        const gRD = getgRD(opp);
        const e = getERD(opp, rating);
        sum += gRD ** 2 * e * (1 - e);
    }
    return 1 / (q ** 2 * sum);
}

function updateRating(user, opponents, outcomes) {
    const D2 = calculateD2(user.rating, opponents);

    let sum = 0;
    for (let i = 0; i < opponents.length; i++) {
        const opp = opponents[i];
        const outcome = outcomes[i];
        const gRD = getgRD(opp);
        const e = getERD(opp, user.rating);
        sum += gRD * (outcome - e);
    }

    const RD_new = Math.sqrt(1 / (1 / user.rd * 2 + 1 / D2));
    const R_new = user.rating + (q / (1 / user.rating ** 2 + 1 / D2)) * sum;

    return { R: R_new, RD: RD_new };
}

