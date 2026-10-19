import streamlit as st
import streamlit.components.v1 as components
import os

# Configuration de la page Streamlit
st.set_page_config(
    page_title="SynapMarchés - Commission Achats Hospitaliers",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Masquer les marges et menus par défaut de Streamlit pour une immersion totale
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding-top: 0rem;
        padding-bottom: 0rem;
        padding-left: 0rem;
        padding-right: 0rem;
        max-width: 100%;
    }
</style>
""", unsafe_allow_html=True)

def load_bundled_app():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    with open(os.path.join(base_dir, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
        
    with open(os.path.join(base_dir, "styles.css"), "r", encoding="utf-8") as f:
        css = f.read()
        
    with open(os.path.join(base_dir, "mock-data.js"), "r", encoding="utf-8") as f:
        mock_data = f.read()
        
    with open(os.path.join(base_dir, "app.js"), "r", encoding="utf-8") as f:
        app_js = f.read()

    with open(os.path.join(base_dir, "chatbot.js"), "r", encoding="utf-8") as f:
        chatbot_js = f.read()
        
    # Inliner les ressources pour garantir un fonctionnement autonome dans le composant Streamlit
    html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')
    html = html.replace('<script src="mock-data.js"></script>', f'<script>\n{mock_data}\n</script>')
    html = html.replace('<script src="app.js"></script>', f'<script>\n{app_js}\n</script>')
    html = html.replace('<script src="chatbot.js"></script>', f'<script>\n{chatbot_js}\n</script>')
    
    return html

# Rendu de l'application SynapMarchés dans Streamlit
bundled_html = load_bundled_app()
components.html(bundled_html, height=1100, scrolling=True)
