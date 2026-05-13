import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { expoDb } from '../../../src/db';
import { AIInsightCard } from '../../../src/components/AIInsightCard';
import { PriorityBadge } from '../../../src/components/PriorityBadge';
import { useCaseStore } from '../../../src/stores/caseStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { Toast } from '../../../src/components/Toast';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { addNote } = useCaseStore();
  const [caseData, setCaseData] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  function loadCase() {
    const c = expoDb.getFirstSync<any>(`SELECT * FROM cases WHERE id = ?`, [id]);
    if (c) {
      setCaseData(c);
      if (!c.is_sensitive) setUnlocked(true);
    }
    const noteRows = expoDb.getAllSync<any>(
      `SELECT * FROM case_notes WHERE case_id = ? ORDER BY created_at DESC`, [id]
    );
    setNotes(noteRows);
  }

  useEffect(() => { loadCase(); }, [id]);

  async function handleUnlock() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to view sensitive case',
      fallbackLabel: 'Use PIN',
    });
    if (result.success) setUnlocked(true);
    else Toast.show({ type: 'error', text1: 'Authentication failed' });
  }

  async function handleAddNote() {
    if (!noteText.trim() || !user) return;
    setAddingNote(true);
    try {
      await addNote(id, noteText.trim(), user.id);
      setNoteText('');
      loadCase();
      Toast.show({ type: 'success', text1: 'Note added' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to add note' });
    } finally {
      setAddingNote(false);
    }
  }

  function handleDelete() {
    const isSynced = caseData?.sync_status === 'synced';
    Alert.alert(
      'Delete Case',
      isSynced
        ? 'This case is synced to the server. Deleting it locally will also mark it for deletion on the server on next upload.\n\nAre you sure?'
        : '⚠️ This case has NOT been synced yet. Deleting it will permanently remove it — it cannot be recovered.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            expoDb.runSync(
              `UPDATE cases SET deleted_at = ?, sync_status = 'pending' WHERE id = ?`,
              [new Date().toISOString(), id]
            );
            Toast.show({ type: 'success', text1: 'Case deleted' });
            router.back();
          },
        },
      ]
    );
  }

  if (!caseData) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#15803d" />
      </View>
    );
  }

  const isSensitiveAndLocked = caseData.is_sensitive && !unlocked;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-12">

      {/* Header card */}
      <View className="bg-white px-4 pt-4 pb-5 border-b border-gray-100">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              {isSensitiveAndLocked ? 'Sensitive Case — Restricted' : caseData.title}
            </Text>
            {caseData.is_sensitive === 1 && (
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="lock-closed" size={12} color="#dc2626" />
                <Text className="text-xs text-red-600 font-medium">Sensitive Case</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <PriorityBadge priority={caseData.priority} />
            <TouchableOpacity
              onPress={handleDelete}
              className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center gap-4 mt-3">
          <View className="flex-row items-center gap-1.5">
            <View className={`w-2 h-2 rounded-full ${
              caseData.status === 'open' ? 'bg-green-500' :
              caseData.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            <Text className="text-sm text-gray-600">{STATUS_LABELS[caseData.status] ?? caseData.status}</Text>
          </View>
          <Text className="text-gray-300">·</Text>
          <Text className="text-sm text-gray-500 capitalize">{caseData.type?.replace('_', ' ')}</Text>
        </View>

        <View className={`mt-3 self-start px-2.5 py-1 rounded-full ${
          caseData.sync_status === 'synced' ? 'bg-green-50' :
          caseData.sync_status === 'conflict' ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          <Text className={`text-xs font-medium ${
            caseData.sync_status === 'synced' ? 'text-green-700' :
            caseData.sync_status === 'conflict' ? 'text-red-700' : 'text-amber-700'
          }`}>
            {caseData.sync_status === 'synced' ? '✓ Synced' :
             caseData.sync_status === 'conflict' ? '⚠ Conflict' : '↑ Pending sync'}
          </Text>
        </View>
      </View>

      {isSensitiveAndLocked ? (
        <View className="mx-4 mt-4 bg-white rounded-2xl border border-red-100 p-6 items-center">
          <Ionicons name="lock-closed" size={40} color="#dc2626" />
          <Text className="text-lg font-bold text-gray-900 mt-3">Restricted Access</Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
            This is a sensitive case. Authenticate to view full details.
          </Text>
          <TouchableOpacity
            className="mt-5 bg-red-600 rounded-xl px-6 py-3"
            onPress={handleUnlock}
          >
            <Text className="text-white font-semibold">Unlock with Biometrics</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4">
            <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Description</Text>
            <Text className="text-sm text-gray-700 leading-5">{caseData.description}</Text>
          </View>

          {caseData.location_lat && caseData.location_lng && (
            <View className="mx-4 mt-3 bg-white rounded-2xl p-4 flex-row items-center gap-3">
              <Ionicons name="location-outline" size={18} color="#15803d" />
              <Text className="text-sm text-gray-700">
                {Number(caseData.location_lat).toFixed(5)}, {Number(caseData.location_lng).toFixed(5)}
              </Text>
            </View>
          )}

          {(caseData.ai_summary || caseData.ai_urgency_score) && (
            <View className="mx-4 mt-3">
              <AIInsightCard case={caseData} />
            </View>
          )}

          <View className="mx-4 mt-4">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Case Notes ({notes.length})</Text>
            <View className="bg-white rounded-2xl p-4 mb-3">
              <TextInput
                className="text-sm text-gray-800 min-h-[60px]"
                placeholder="Add a note..."
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                value={noteText}
                onChangeText={setNoteText}
              />
              <TouchableOpacity
                className={`mt-3 self-end px-4 py-2 rounded-lg ${noteText.trim() ? 'bg-green-700' : 'bg-gray-100'}`}
                onPress={handleAddNote}
                disabled={!noteText.trim() || addingNote}
              >
                {addingNote
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text className={`text-xs font-medium ${noteText.trim() ? 'text-white' : 'text-gray-400'}`}>Add Note</Text>
                }
              </TouchableOpacity>
            </View>

            {notes.map((note) => (
              <View key={note.id} className="bg-white rounded-2xl p-4 mb-2">
                <Text className="text-sm text-gray-700">{note.body}</Text>
                <Text className="text-xs text-gray-400 mt-2">
                  {new Date(note.created_at).toLocaleString('en-GB')}
                  {note.sync_status !== 'synced' && ' · Not yet synced'}
                </Text>
              </View>
            ))}
          </View>

          <View className="mx-4 mt-3 bg-white rounded-3xl p-5">
            <Text className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Details</Text>
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center">
                <Ionicons name="person-outline" size={16} color="#15803d" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-800">
                  {caseData.created_by_name ?? user?.name ?? 'Unknown'}
                </Text>
                <Text className="text-xs text-gray-400">
                  {caseData.created_by_email ?? user?.email ?? ''}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-6 pt-3 border-t border-gray-50">
              <View>
                <Text className="text-xs text-gray-400">Created</Text>
                <Text className="text-sm font-medium text-gray-700 mt-0.5">
                  {new Date(caseData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-gray-400">Updated</Text>
                <Text className="text-sm font-medium text-gray-700 mt-0.5">
                  {new Date(caseData.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
