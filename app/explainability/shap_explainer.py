import joblib
import numpy as np
import pandas as pd
import shap

from app.models._paths import artifact

LABEL_MAP = {0: "benign", 1: "defacement", 2: "phishing", 3: "malware"}

FEATURE_LABELS = {
    "url_len":                    "URL length",
    "@":                          "@ symbol in URL",
    "?":                          "Query string present",
    "-":                          "Hyphens in URL",
    "=":                          "Parameter assignments",
    ".":                          "Dot count",
    "#":                          "Fragment identifier",
    "%":                          "URL encoding",
    "+":                          "Plus signs",
    "$":                          "Dollar signs",
    "!":                          "Exclamation marks",
    "*":                          "Asterisks",
    ",":                          "Commas",
    "//":                         "Double slashes",
    "digits":                     "Digit count",
    "letters":                    "Letter count",
    "Shortining_Service":         "URL shortener used",
    "having_ip_address":          "Raw IP address",
    "phish_urgency_words":        "Urgency words (verify, confirm…)",
    "phish_security_words":       "Security words (secure, login…)",
    "phish_brand_mentions":       "Brand name in URL",
    "phish_brand_hijack":         "Brand impersonation",
    "phish_multiple_subdomains":  "Multiple subdomains",
    "phish_long_path":            "Unusually long path",
    "phish_many_params":          "Many query parameters",
    "phish_suspicious_tld":       "Suspicious domain extension",
    "phish_adv_exact_brand_match":"Exact brand match",
    "phish_adv_brand_in_subdomain":"Brand in subdomain",
    "phish_adv_brand_in_path":    "Brand in path",
    "phish_adv_hyphen_count":     "Hyphens in domain",
    "phish_adv_number_count":     "Numbers in domain",
    "phish_adv_suspicious_tld":   "Suspicious TLD (.tk, .xyz…)",
    "phish_adv_long_domain":      "Long domain name",
    "phish_adv_many_subdomains":  "Many subdomains",
    "phish_adv_encoded_chars":    "Encoded characters",
    "phish_adv_path_keywords":    "Suspicious path keywords",
    "phish_adv_has_redirect":     "Redirect in URL",
    "phish_adv_many_params":      "Many URL parameters",
    "path_has_hacked_terms":      "Hacked/malware terms in path",
    "suspicious_extension":       "Suspicious file extension",
    "path_underscore_count":      "Underscores in path",
    "is_gov_edu":                 "Government/education domain",
}


class SHAPExplainer:
    def __init__(self):
        self.model = joblib.load(artifact("decision_tree.pkl"))
        self.feature_names = joblib.load(artifact("feature_names.pkl"))
        self.explainer = shap.TreeExplainer(self.model)
        print("[SHAP] Explainer initialized.")

    def explain(self, feature_dict: dict) -> dict:
        vector = pd.DataFrame([{
            f: feature_dict.get(f, 0) for f in self.feature_names
        }])

        shap_values = self.explainer.shap_values(vector)

        predicted_class = int(self.model.predict(vector)[0])
        predicted_label = LABEL_MAP[predicted_class]

        # SHAP's TreeExplainer returns different shapes across versions:
        #   shap<0.40 multi-class: list of length n_classes, each (n_samples, n_features)
        #   shap>=0.40             : single ndarray (n_samples, n_features, n_classes)
        #   binary classifier      : single ndarray (n_samples, n_features)
        if isinstance(shap_values, list):
            class_shap = np.asarray(shap_values[predicted_class][0])
        else:
            sv = np.asarray(shap_values)
            if sv.ndim == 3:
                # (n_samples, n_features, n_classes) — newer SHAP
                if sv.shape[-1] == len(LABEL_MAP):
                    class_shap = sv[0, :, predicted_class]
                else:
                    # (n_classes, n_samples, n_features) — older layout
                    class_shap = sv[predicted_class][0]
            else:
                class_shap = sv[0]

        feature_impacts = [
            {
                "feature": name,
                "label": FEATURE_LABELS.get(name, name),
                "shap_value": round(float(val), 6),
            }
            for name, val in zip(self.feature_names, class_shap)
        ]
        feature_impacts.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        top_features = feature_impacts[:10]

        pushing_malicious = [f for f in top_features if f["shap_value"] > 0]
        pushing_benign = [f for f in top_features if f["shap_value"] < 0]

        expected = self.explainer.expected_value
        if isinstance(expected, (list, np.ndarray)):
            base_value = float(np.asarray(expected).flatten()[predicted_class])
        else:
            base_value = float(expected)

        return {
            "predicted_label": predicted_label,
            "predicted_class": predicted_class,
            "top_features": top_features,
            "pushing_malicious": pushing_malicious,
            "pushing_benign": pushing_benign,
            "base_value": round(base_value, 6),
        }
