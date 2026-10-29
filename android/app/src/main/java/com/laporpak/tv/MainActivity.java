package com.laporpak.tv;

import android.media.audiofx.Equalizer;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public class MainActivity extends BridgeActivity {
    private static final String TV_USER_AGENT = "Mozilla/5.0 (Linux; Android 12; Android TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private Equalizer equalizer = null;
    private boolean voiceFocusActive = false;

    public class TvAppBridge {
        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> finish());
        }

        @JavascriptInterface
        public void setVoiceFocus(boolean enabled) {
            runOnUiThread(() -> applyVoiceFocusNative(enabled));
        }

        @JavascriptInterface
        public boolean isVoiceFocusActive() {
            return voiceFocusActive;
        }
    }

    private void applyVoiceFocusNative(boolean enabled) {
        voiceFocusActive = enabled;
        try {
            if (equalizer == null) {
                // Audio session 0 attaches DSP to global audio output of this application
                equalizer = new Equalizer(1000, 0);
            }

            if (!enabled) {
                equalizer.setEnabled(false);
                return;
            }

            equalizer.setEnabled(true);
            short numBands = equalizer.getNumberOfBands();
            short[] bandRange = equalizer.getBandLevelRange();
            short minLevel = bandRange != null && bandRange.length > 0 ? bandRange[0] : -1000;
            short maxLevel = bandRange != null && bandRange.length > 1 ? bandRange[1] : 1000;

            // Target vocal profile:
            // 1. Cut bass (< 250 Hz) by -400 mB (-4 dB) to eliminate BGM rumbling
            // 2. Boost vocal presence (800 Hz to 4.5 kHz) by +500 mB (+5 dB) to bring voice forward
            for (short i = 0; i < numBands; i++) {
                int centerFreqMilliHz = equalizer.getCenterFreq(i);
                if (centerFreqMilliHz < 250000) {
                    equalizer.setBandLevel(i, (short) Math.max(minLevel, -400));
                } else if (centerFreqMilliHz >= 800000 && centerFreqMilliHz <= 4500000) {
                    equalizer.setBandLevel(i, (short) Math.min(maxLevel, 500));
                } else {
                    equalizer.setBandLevel(i, (short) 0);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (equalizer != null) {
            try {
                equalizer.setEnabled(false);
                equalizer.release();
            } catch (Exception ignored) {}
            equalizer = null;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Set standard TV browser user agent so InfinityFree firewall does not block with 403
        System.setProperty("http.agent", TV_USER_AGENT);

        trustAllCertificates();
        super.onCreate(savedInstanceState);

        if (bridge != null) {
            bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
                @Override
                public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                    handler.proceed();
                }
            });

            // Configure WebView settings & cookies
            try {
                WebView wv = bridge.getWebView();
                if (wv != null) {
                    wv.getSettings().setUserAgentString(TV_USER_AGENT);
                    wv.getSettings().setMediaPlaybackRequiresUserGesture(false);
                    wv.getSettings().setDomStorageEnabled(true);
                    wv.getSettings().setDatabaseEnabled(true);
                    wv.addJavascriptInterface(new TvAppBridge(), "TvAppBridge");
                    CookieManager cm = CookieManager.getInstance();
                    cm.setAcceptCookie(true);
                    cm.setAcceptThirdPartyCookies(wv, true);
                }
            } catch (Exception ignored) {}
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_DOWN) {
            WebView wv = bridge != null ? bridge.getWebView() : null;
            if (wv != null) {
                wv.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('tvbackbutton', { bubbles: true, cancelable: true })); " +
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));",
                    null
                );
                return true; // Consumed: Prevents Android from immediately destroying the activity!
            }
        }
        return super.dispatchKeyEvent(event);
    }

    private void trustAllCertificates() {
        try {
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };

            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, trustAllCerts, new SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
            HttpsURLConnection.setDefaultHostnameVerifier(new HostnameVerifier() {
                public boolean verify(String hostname, SSLSession session) {
                    return true;
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
