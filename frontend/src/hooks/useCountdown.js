import { useEffect, useState } from "react";

/**
 * Builds the countdown state for a target date.
 *
 * @param {string|Date|null|undefined} targetTime - The countdown target.
 * @returns {{ hours: number, minutes: number, seconds: number, isExpired: boolean, totalSecondsLeft: number, urgencyLevel: string }} The computed countdown state.
 */
function getCountdownState(targetTime) {
  if (!targetTime) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalSecondsLeft: 0,
      urgencyLevel: "critical",
    };
  }

  const diff = new Date(targetTime).getTime() - new Date().getTime();

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalSecondsLeft: 0,
      urgencyLevel: "critical",
    };
  }

  const totalSecondsLeft = Math.floor(diff / 1000);
  const urgencyLevel =
    totalSecondsLeft > 300 ? "safe" : totalSecondsLeft > 60 ? "warning" : "critical";

  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isExpired: false,
    totalSecondsLeft,
    urgencyLevel,
  };
}

/**
 * Tracks a live countdown state for the supplied target time.
 *
 * @param {string|Date|null|undefined} targetTime - The countdown target.
 * @returns {{ hours: number, minutes: number, seconds: number, isExpired: boolean, totalSecondsLeft: number, urgencyLevel: string }} The live countdown state.
 */
export default function useCountdown(targetTime) {
  const [countdown, setCountdown] = useState(() => getCountdownState(targetTime));

  useEffect(() => {
    setCountdown(getCountdownState(targetTime));

    const intervalId = window.setInterval(() => {
      setCountdown(getCountdownState(targetTime));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetTime]);

  return countdown;
}
