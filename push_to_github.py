"""
Script pour pousser automatiquement le projet SynapMarchés vers GitHub
Utilise dulwich (bibliothèque Git en Python pur)
"""
import sys
import os
import getpass
from dulwich.repo import Repo
from dulwich import porcelain
from dulwich.client import get_transport_and_path

def push_to_github(remote_url, token=None):
    repo_path = os.path.dirname(os.path.abspath(__file__))
    repo = Repo(repo_path)
    
    # Format URL with token if provided
    push_url = remote_url.strip()
    if token and "https://" in push_url and "@" not in push_url:
        push_url = push_url.replace("https://", f"https://{token.strip()}@")
    
    print(f"📦 Préparation de l'envoi vers {remote_url}...")
    try:
        porcelain.push(repo, push_url, refspecs=[b"refs/heads/master:refs/heads/main"])
        print("✅ Projet envoyé avec succès sur la branche 'main' de votre GitHub !")
        return True
    except Exception as e:
        # Fallback to master if main doesn't work
        try:
            porcelain.push(repo, push_url, refspecs=[b"refs/heads/master:refs/heads/master"])
            print("✅ Projet envoyé avec succès sur la branche 'master' de votre GitHub !")
            return True
        except Exception as e2:
            print(f"❌ Erreur lors du push : {e2}")
            return False

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else input("Entrez l'URL de votre dépôt GitHub (ex: https://github.com/votre-nom/marches-app.git) : ")
    token = sys.argv[2] if len(sys.argv) > 2 else getpass.getpass("Entrez votre GitHub Personal Access Token (ou mot de passe) : ")
    push_to_github(url, token)
