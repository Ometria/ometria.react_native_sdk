import React, { useState } from 'react';
import { Platform, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
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
  log(`▶︎ E2E run ${runId} (${Platform.OS})`);
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
  await step('profileDeidentified', () => Ometria.trackProfileDeidentifiedEvent());
  await step('flush', () => Ometria.flush());

  log(`✅ done — run ${runId}`);
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
    try {
      await runE2ESuite(ids, line => setLog(prev => [...prev, line]));
    } catch (error) {
      setLog(prev => [...prev, `❌ ${String(error)}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.btn, running && styles.btnDisabled]}
        disabled={running}
        onPress={run}
      >
        <Text style={styles.btnText}>
          {running ? '🧪 Running E2E suite…' : '🧪 Run E2E suite'}
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
