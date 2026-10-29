import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, type Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: {
            getItem: (key) => SecureStore.getItemAsync(key),
            setItem: (key, value) => SecureStore.setItemAsync(key, value),
            removeItem: (key) => SecureStore.deleteItemAsync(key),
          },
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

type MembershipSummary = {
  membership_status: string;
  membership_source: string;
  integration_status: string;
  expires_at: string | null;
  last_synced_at: string | null;
  privileges: string[];
  card_status: string | null;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [summary, setSummary] = useState<MembershipSummary | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(supabase !== null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage('Your saved sign-in could not be restored. Please sign in again.');
        setMessageIsError(true);
      }
      setSession(data.session);
      setLoading(false);
    }).catch((error: unknown) => {
      console.error('Saved member session could not be restored.', error);
      setMessage('Your saved sign-in could not be restored. Please sign in again.');
      setMessageIsError(true);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSummary(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      return;
    }

    let active = true;
    supabase.rpc('get_my_access_summary').then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('Membership summary could not be loaded.', error);
        setMessage('Membership details are unavailable. Please try again later.');
        setMessageIsError(true);
        return;
      }
      setSummary((data?.[0] as MembershipSummary | undefined) ?? null);
    });
    return () => {
      active = false;
    };
  }, [session]);

  async function submitAuth() {
    if (!supabase) return;
    setSubmitting(true);
    setMessage('');
    setMessageIsError(false);
    try {
      const result = registering
        ? await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: { data: { full_name: fullName.trim() } },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
      if (result.error) {
        setMessage(
          registering
            ? 'Account registration could not be completed. Check your details and try again.'
            : 'Sign-in failed. Check your email and password, then try again.',
        );
        setMessageIsError(true);
      } else if (registering && !result.data.session) {
        setMessage('Check your email for a verification link. Membership is activated separately by authorized staff.');
      }
    } catch (error) {
      console.error('Member authentication request failed.', error);
      setMessage('The request could not be completed. Please try again later.');
      setMessageIsError(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Member sign-out failed.', error);
      setMessage('Sign-out could not be completed. Please try again.');
      setMessageIsError(true);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.lime} size="large" />
      </Screen>
    );
  }

  if (!supabase) {
    return (
      <Screen>
        <Brand />
        <Text style={styles.title}>Member access is not configured.</Text>
        <Text style={styles.body}>
          Add the public Supabase URL and anon key to the mobile app environment,
          then rebuild the app. Never add a service-role key here.
        </Text>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Brand />
        <Text style={styles.eyebrow}>YOUR MEMBERSHIP, IN YOUR POCKET</Text>
        <Text style={styles.title}>{registering ? 'Join Lotus.' : 'Welcome back.'}</Text>
        <Text style={styles.body}>
          {registering
            ? 'Create your secure account. Your membership and physical entrance access remain managed by Lotus staff and Maksisoft.'
            : 'Sign in securely to see membership information verified by Lotus Gym.'}
        </Text>
        <View style={styles.form}>
          {registering && (
            <TextInput
              autoComplete="name"
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={fullName}
            />
          )}
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <TextInput
            autoComplete={registering ? 'new-password' : 'current-password'}
            onChangeText={setPassword}
            placeholder="Password (at least 12 characters)"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {message ? (
            <Text accessibilityLiveRegion="polite" style={messageIsError ? styles.error : styles.notice}>
              {message}
            </Text>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={submitting || password.length < 12 || (registering && !fullName.trim())}
            onPress={submitAuth}
            style={[styles.button, (submitting || password.length < 12) && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'PLEASE WAIT…' : registering ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => { setRegistering(!registering); setMessage(''); }}>
          <Text style={styles.link}>
            {registering ? 'Already have an account? Sign in' : 'New to Lotus? Create an account'}
          </Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const verified = summary?.membership_source === 'maksisoft' &&
    summary.integration_status === 'verified';
  const active = verified && summary?.membership_status === 'active';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.dashboard}>
        <Brand />
        <Text style={styles.eyebrow}>LOTUS MEMBER ACCOUNT</Text>
        <Text style={styles.title}>Your membership.</Text>
        <Text style={styles.body}>{session.user.email}</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>MEMBERSHIP STATUS</Text>
          <Text style={styles.status}>{summary?.membership_status ?? 'pending'}</Text>
          <Text style={styles.cardBody}>
            {verified
              ? 'Membership details verified by Maksisoft.'
              : 'No membership data has been verified by Maksisoft. Digital privileges are unavailable.'}
          </Text>
          {summary?.expires_at ? (
            <Text style={styles.cardBody}>
              Expires {new Date(summary.expires_at).toLocaleDateString()}
            </Text>
          ) : null}
          {summary?.last_synced_at ? (
            <Text style={styles.cardBody}>
              Last synchronized {new Date(summary.last_synced_at).toLocaleString()}
            </Text>
          ) : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PHYSICAL ENTRANCE</Text>
          <Text style={styles.cardBody}>
            {summary?.card_status
              ? `Card status: ${summary.card_status}.`
              : 'Your physical card is managed by Lotus Gym through Maksisoft.'}
          </Text>
          <Text style={styles.cardBody}>
            This app cannot unlock the door. Contact the gym if your card is lost.
          </Text>
        </View>
        {active ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DIGITAL PRIVILEGES</Text>
            <Text style={styles.cardBody}>
              {(summary?.privileges ?? []).join(' · ') || 'No digital privileges assigned.'}
            </Text>
          </View>
        ) : null}
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <TouchableOpacity accessibilityRole="button" onPress={signOut} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
      <Text style={styles.brandName}>LOTUS FITNESS</Text>
    </View>
  );
}

const colors = {
  background: '#111310',
  surface: '#1b1e19',
  lime: '#c5f36b',
  text: '#f4f4ef',
  muted: '#a3a89d',
  error: '#ff9999',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  dashboard: { flexGrow: 1, padding: 26, paddingTop: 44 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 52 },
  brandMark: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime,
    alignItems: 'center', justifyContent: 'center',
  },
  brandMarkText: { color: colors.background, fontSize: 22, fontWeight: '900' },
  brandName: { color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  eyebrow: { color: colors.lime, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 36, fontWeight: '800', marginTop: 10, marginBottom: 12 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 26 },
  form: { gap: 12, marginBottom: 22 },
  input: {
    backgroundColor: colors.surface, borderColor: '#343830', borderWidth: 1,
    borderRadius: 10, color: colors.text, fontSize: 16, padding: 16,
  },
  button: {
    alignItems: 'center', backgroundColor: colors.lime, borderRadius: 10,
    justifyContent: 'center', minHeight: 54, marginTop: 8,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  link: { color: colors.lime, fontSize: 14, fontWeight: '700', paddingVertical: 16 },
  error: { color: colors.error, fontSize: 14, lineHeight: 21, marginVertical: 8 },
  notice: { color: colors.lime, fontSize: 14, lineHeight: 21, marginVertical: 8 },
  card: {
    backgroundColor: colors.surface, borderColor: '#343830', borderWidth: 1,
    borderRadius: 14, gap: 10, marginTop: 16, padding: 18,
  },
  cardLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  status: { color: colors.lime, fontSize: 22, fontWeight: '800', textTransform: 'capitalize' },
  cardBody: { color: colors.text, fontSize: 14, lineHeight: 21 },
  secondaryButton: {
    alignItems: 'center', borderColor: '#545a4e', borderRadius: 10, borderWidth: 1,
    justifyContent: 'center', minHeight: 50, marginTop: 26,
  },
  secondaryButtonText: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
});
