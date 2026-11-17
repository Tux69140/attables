package attables.biovibralyon.fr

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  // Pont natif AttablesAndroid : à préserver si gen/android est régénéré (comme signingConfigs).
  // enableEdgeToEdge() choisit la couleur des icônes des barres système d'après le mode du
  // téléphone, pas d'après le thème de l'appli : thème clair + téléphone sombre = icônes
  // blanches sur fond sable. L'appli indique donc son thème effectif ici. Contenu local
  // uniquement (assets Tauri), une seule méthode, un seul booléen, aucun réseau.
  // Ordre vérifié dans wry 0.57 (src/android/main_pipe.rs, CreateWebView) : setWebView() appelle
  // ce point d'accroche AVANT loadUrlMainThread(), qui ne fait que poster loadUrl() sur la file du
  // thread principal. L'interface existe donc dès le premier chargement de la page (comme
  // window.ipc de Tauri, ajouté encore plus tard dans la même séquence) : pas de rechargement requis.
  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.addJavascriptInterface(PontBarresSysteme(), "AttablesAndroid")
  }

  private inner class PontBarresSysteme {
    @JavascriptInterface
    fun barresSysteme(sombre: Boolean) {
      runOnUiThread {
        val controleur = WindowCompat.getInsetsController(window, window.decorView)
        controleur.isAppearanceLightStatusBars = !sombre
        controleur.isAppearanceLightNavigationBars = !sombre
      }
    }
  }
}
