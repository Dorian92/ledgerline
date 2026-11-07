import { Modal, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { resetDemoDatabase } from '@/data/bootstrap';
import { ButtonUi } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { color, radius, space } from '@/ui/tokens';

export function DemoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="title">Demo data</Text>
          <Text variant="secondary">You are viewing sample data. Nothing here is real.</Text>
          <ButtonUi
            title="Start my journal"
            onPress={() => {
              onClose();
              router.push('/(onboarding)/create-account');
            }}
          />
          <ButtonUi
            title="Reset demo data"
            variant="secondary"
            onPress={async () => {
              await resetDemoDatabase();
              onClose();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: space.lg,
    gap: space.md,
  },
});
