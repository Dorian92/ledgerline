import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { useRepos } from '@/data/DbProvider';
import { importAdapters } from '@/domain/import/adapters';
import { buildImportPlan } from '@/domain/import/plan';
import { useRealModeOnly } from '@/features/guards';
import { DemoGuardPanel } from '@/features/settings/DemoGuardPanel';
import { NavScreen } from '@/ui/NavScreen';
import { useImportDraft } from '@/state/importDraft';
import { useSession } from '@/state/session';
import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, radius, space } from '@/ui/tokens';

const SAMPLE = `Time,Symbol,Side,Qty,Entry,Exit
2024-01-01T12:00:00Z,BTC-PERP,long,0.1,100,101
2024-01-02T12:00:00Z,ETH-PERP,short,1,50,49
`;

const EXCHANGES = [
  { id: 'binance', label: 'Binance', monogram: 'B' },
  { id: 'bybit', label: 'Bybit', monogram: 'BY' },
  { id: 'okx', label: 'OKX', monogram: 'OK' },
] as const;

export default function ImportIndexScreen() {
  const router = useRouter();
  const guard = useRealModeOnly();
  const repos = useRepos();
  const mode = useSession((s) => s.mode);
  const accountId = useSession((s) => s.activeAccountId);
  const setDraft = useImportDraft((s) => s.setDraft);

  const loadText = async (fileName: string, text: string) => {
    if (!accountId) {
      return;
    }
    const fps = await repos.imports.existingFingerprints(accountId);
    const account = await repos.accounts.get(accountId);
    const quote = account?.quote_currency ?? 'USDC';
    const plan = await buildImportPlan({
      text,
      adapters: importAdapters,
      quoteCurrency: quote,
      sourceTz: 'UTC',
      existingFingerprints: fps,
    });
    if (!('summary' in plan)) {
      return;
    }
    setDraft({ fileName, text, plan });
    router.push('/import/preview');
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const text = await FileSystem.readAsStringAsync(asset.uri);
    await loadText(asset.name ?? 'import.csv', text);
  };

  if (!guard.allowed) {
    if (mode === 'demo') {
      return (
        <DemoGuardPanel
          title="Import trades"
          body={guard.reason ?? 'Imports and backups go into your journal, not demo data.'}
        />
      );
    }
    return (
      <NavScreen title="Import trades">
        <Text variant="secondary">{guard.reason ?? 'Import is unavailable right now.'}</Text>
        {mode === 'real' && !accountId ? (
          <>
            <ButtonUi
              title="Start my journal"
              onPress={() => router.push('/(onboarding)/create-account')}
              style={{ marginTop: space.lg }}
            />
            <ButtonUi title="Back" variant="secondary" onPress={() => router.back()} />
          </>
        ) : (
          <ButtonUi title="Back" variant="secondary" onPress={() => router.back()} />
        )}
      </NavScreen>
    );
  }

  if (!accountId) {
    return (
      <NavScreen title="Import trades">
        <Text variant="secondary">Create a journal account before importing trades.</Text>
        <ButtonUi
          title="Start my journal"
          onPress={() => router.push('/(onboarding)/create-account')}
          style={{ marginTop: space.lg }}
        />
      </NavScreen>
    );
  }

  return (
    <NavScreen title="Import trades" scroll contentContainerStyle={styles.container}>
      <Text variant="secondary">
        Import a CSV on this device (no upload). Hyperliquid public fill ledger is supported when
        headers match the verified sample. Use a USDC quote account for the stuxfred candidate file.
        Binance, Bybit and OKX tiles remain unverified.
      </Text>
      <View style={styles.tiles}>
        {EXCHANGES.map((ex) => (
          <View key={ex.id} style={styles.tile}>
            <Text variant="title">{ex.monogram}</Text>
            <Text variant="body">{ex.label}</Text>
            <Text variant="caption" style={styles.notYet}>
              Not yet
            </Text>
          </View>
        ))}
      </View>
      <ButtonUi title="Choose CSV file" onPress={pickFile} />
      {__DEV__ ? (
        <ButtonUi
          title="Load synthetic test CSV (dev only)"
          variant="secondary"
          onPress={() => loadText('SYNTHETIC_test.csv', SAMPLE)}
        />
      ) : null}
    </NavScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    paddingTop: 48,
    gap: space.md,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '30%',
    minWidth: 100,
    backgroundColor: color.card,
    borderRadius: radius.card,
    padding: space.md,
    alignItems: 'center',
    gap: space.xs,
    opacity: 0.85,
  },
  notYet: { color: color.textMuted, textTransform: 'none' },
});
