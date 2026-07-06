import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import Ometria from 'react-native-ometria';
import { demoBasketItems } from './data';

/**
 * Self-contained end-to-end event tester.
 *
 * <E2EPanel /> renders a button that fires the full tracking catalog in a fixed
 * funnel order against a unique throwaway test profile, pausing 1s between
 * events (distinct dashboard timestamps + live on-screen log). After running on
 * a device, verify the events in the Ometria dashboard — filter by the printed
 * runId — using ~/Dev/ometria-build-artifacts/verify-events.mjs.
 */

export type E2EIds = {
  runId: string;
  email: string;
  customerId: string;
  storeId: string;
};

export function makeE2EIds(): E2EIds {
  const ts = Date.now();
  return {
    runId: `${ts}`,
    email: `e2e+${ts}@ometria.com`,
    customerId: `e2e-${ts}`,
    storeId: `e2e-store-${ts}`,
  };
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const basket = {
  totalPrice: 12.0,
  currency: 'USD',
  items: demoBasketItems,
  link: 'link_eg',
  id: 'basket_id_eg',
};

export async function runE2ESuite(ids: E2EIds, log: (line: string) => void) {
  const { runId, email, customerId, storeId } = ids;

  const step = async (label: string, fn: () => void) => {
    fn();
    log(`✓ ${label}`);
    await sleep(1000);
  };

  Ometria.isLoggingEnabled(true);
  await sleep(1000);

  await step('customEvent e2e_start', () => Ometria.trackCustomEvent('e2e_start', { runId }));
  await step(`profileIdentified ${customerId}`, () => Ometria.trackProfileIdentifiedEvent(customerId, email, storeId));
  await step('homeScreenViewed', () => Ometria.trackHomeScreenViewedEvent());
  await step('screenViewed E2EScreen', () => Ometria.trackScreenViewedEvent('E2EScreen', { runId }));
  await step('productListingViewed', () => Ometria.trackProductListingViewedEvent('product_list', {}));
  await step('productViewed productId-1', () => Ometria.trackProductViewedEvent('productId-1'));
  await step('basketViewed', () => Ometria.trackBasketViewedEvent());
  await step('basketUpdated', () => Ometria.trackBasketUpdatedEvent(basket));
  await step('checkoutStarted orderId-1', () => Ometria.trackCheckoutStartedEvent('orderId-1'));
  await step('orderCompleted orderId-1', () => Ometria.trackOrderCompletedEvent('orderId-1', basket));
  await step('deepLinkOpened /profile', () => Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen'));
  await step('customEvent e2e_end', () => Ometria.trackCustomEvent('e2e_end', { runId }));
  await step('flush', () => Ometria.flush());

  log(`✅ done — run ${runId}`);
}

/**
 * Tracking-switch tester — validates setTrackingEnabled(false/true).
 *
 * Fires a bracketed run (ts_start … ts_end, both carry runId). While tracking is
 * OFF it fires clearly-tagged events that MUST be blocked (a ts_blocked customEvent,
 * a ts-blocked-product productViewed, and a flush). The only events that should
 * reach the dashboard inside the window are: ts_start, the final opt-out
 * permissionsUpdate, the re-enable permissionsUpdate, and ts_end. Verify with
 * ~/Dev/ometria-build-artifacts/verify-events.{mjs,html} (filter by runId).
 *
 * Note: the "app starts with tracking off sends nothing" acceptance criterion
 * needs a real app restart, so it must be checked manually — it is not covered by
 * this single in-app run.
 */
export async function runTrackingSwitchSuite(ids: E2EIds, log: (line: string) => void) {
  const { runId } = ids;

  const step = async (label: string, fn: () => void) => {
    fn();
    log(`✓ ${label}`);
    await sleep(1000);
  };

  Ometria.isLoggingEnabled(true);
  await sleep(1000);

  // Baseline on (before the bracket, so its permissionsUpdate falls outside the window).
  await step('setTrackingEnabled(true) [baseline]', () => Ometria.setTrackingEnabled(true));
  await step('customEvent ts_start', () => Ometria.trackCustomEvent('ts_start', { runId }));

  // Disable → SDK sends one final opt-out permissionsUpdate + flush, then blocks.
  await step('setTrackingEnabled(false)', () => Ometria.setTrackingEnabled(false));
  const offState = await Ometria.getTrackingEnabled();
  log(`${offState === false ? '✓' : '✗'} getTrackingEnabled() === false${offState === false ? '' : ` (got ${offState})`}`);

  // Everything below MUST be blocked — nothing here should reach the dashboard.
  await step('BLOCKED customEvent ts_blocked', () => Ometria.trackCustomEvent('ts_blocked', { runId }));
  await step('BLOCKED productViewed ts-blocked-product', () => Ometria.trackProductViewedEvent('ts-blocked-product'));
  await step('BLOCKED flush', () => Ometria.flush());

  // Re-enable → SDK sends the OS-value permissionsUpdate + flush, resumes tracking.
  await step('setTrackingEnabled(true)', () => Ometria.setTrackingEnabled(true));
  const onState = await Ometria.getTrackingEnabled();
  log(`${onState === true ? '✓' : '✗'} getTrackingEnabled() === true${onState === true ? '' : ` (got ${onState})`}`);

  await step('customEvent ts_end', () => Ometria.trackCustomEvent('ts_end', { runId }));
  await step('flush', () => Ometria.flush());

  // Deidentify only at the very end, so the whole E2E (funnel + tracking-switch) runs
  // under the identified profile.
  await step('profileDeidentified', () => Ometria.trackProfileDeidentifiedEvent());
  await step('flush', () => Ometria.flush());

  log(`✅ done — tracking-switch run ${runId}`);
}

/** Button + live progress log. Drop into any screen: `<E2EPanel />`. */
export function E2EPanel() {
  const [running, setRunning] = useState(false);
  const [info, setInfo] = useState<E2EIds | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const run = async () => {
    const ids = makeE2EIds();
    setInfo(ids);
    setLog([]);
    setRunning(true);
    const append = (line: string) => setLog(prev => [...prev, line]);
    try {
      await runE2ESuite(ids, append);
      await runTrackingSwitchSuite(ids, append);
    } catch (error) {
      setLog(prev => [...prev, `❌ ${String(error)}`]);
    } finally {
      setRunning(false);
    }
  };

  const clear = () => {
    setInfo(null);
    setLog([]);
  };

  // Once a run has finished, the same button clears the logs and returns to "Run E2E suite".
  const hasRun = info !== null && !running;

  return (
    <View>
      <TouchableOpacity
        style={[styles.btn, running && styles.btnDisabled]}
        disabled={running}
        onPress={hasRun ? clear : run}
      >
        <Text style={styles.btnText}>
          {running ? '🧪 Running…' : hasRun ? '🧹 Clear E2E logs' : '🧪 Run E2E suite'}
        </Text>
      </TouchableOpacity>

      {info && (
        <View style={styles.panel}>
          <Text style={styles.bold}>🧪 E2E run {info.runId}</Text>
          <Text style={styles.line} selectable>
            profile: {info.email}
          </Text>
          {log.map((l, i) => (
            <Text key={i} style={styles.logLine}>
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 12, marginVertical: 6, alignItems: 'center', backgroundColor: '#1e1f4d' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF' },
  panel: { marginVertical: 8 },
  bold: { fontWeight: 'bold', paddingVertical: 4, color: '#000' },
  line: { color: '#000' },
  logLine: { color: '#000', fontSize: 12 },
});
