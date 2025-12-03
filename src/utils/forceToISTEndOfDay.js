export function forceToISTEndOfDay(dateString) {
    const date = new Date(dateString + "T00:00:00.000Z");

    const IST_OFFSET_MINUTES = 5.5 * 60;

    date.setUTCMinutes(date.getUTCMinutes() + IST_OFFSET_MINUTES);

    date.setUTCHours(23, 59, 59, 999);

    date.setUTCMinutes(date.getUTCMinutes() - IST_OFFSET_MINUTES);

    return date;
}