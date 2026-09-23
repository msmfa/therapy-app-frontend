/**
 * How many of the app's own sheets are on screen right now.
 *
 * iOS presents a React Native `<Modal>` as a view controller, and a view
 * controller that is already presenting one refuses to present another:
 *
 *     Attempt to present <RCTFabricModalHostViewController> on
 *     <UIViewController> which is already presenting
 *     <RCTFabricModalHostViewController>.
 *
 * UIKit logs that and gives up. React Native does not retry, and the second
 * modal is still mounted and still believes it is visible, so nothing will
 * ever ask again. That is how one alert raised from inside a sheet used to
 * take every later alert in the session down with it: the alert host stayed
 * mounted on a snapshot that was never presented, and every `showAlert`
 * after it only swapped that invisible host's props.
 *
 * So the app alert waits instead. Sheets register here while they are up,
 * and the alert holds until the count is back to zero, which is the one
 * moment it is certain to be able to present.
 */

let presented = 0;

type Listener = () => void;

const listeners = new Set<Listener>();

const notify = () => {
    for (const listener of [...listeners]) listener();
};

/** A sheet has gone up. Pair with exactly one `leavePresentation`. */
export const enterPresentation = () => {
    presented += 1;
    notify();
};

export const leavePresentation = () => {
    presented = Math.max(0, presented - 1);
    notify();
};

/** True while anything is presented that an alert could not present over. */
export const isPresenting = () => presented > 0;

export const subscribePresentation = (listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};

/** Tests only: forget any count a previous test left behind. */
export const resetPresentation = () => {
    presented = 0;
    listeners.clear();
};
