import streamlit as st
import requests
import json

st.title("EcoPulse α - Sustainable Intelligence Engine")
st.write("Upload a product image or enter a URL to get an EcoScore!")

# Input
url = st.text_input("Product URL (e.g., https://example.com/product)")
uploaded_file = st.file_uploader("Or upload an image", type=["jpg", "png"])

if st.button("Analyze"):
    if url or uploaded_file:
        api_url = "https://ecopulse-alpha-1005723035457.europe-west1.run.app/analyze"
        try:
            if uploaded_file:
                files = {"file": uploaded_file.getvalue()}
                response = requests.post(api_url, files=files)
            else:
                response = requests.post(api_url, json={"url": url})
            if response.status_code == 200:
                data = response.json()
                st.subheader("EcoScore")
                st.bar_chart({
                    "Carbon Footprint": [data["eco_score"]["carbon"]],
                    "Recyclability": [data["eco_score"]["recyclability"]],
                    "Ethical Sourcing": [data["eco_score"]["sourcing"]]
                })
                st.write("Green Alternatives:")
                for alt in data["alternatives"]:
                    st.write(f"- {alt}")
            else:
                st.error(f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            st.error(f"Failed to connect to backend: {str(e)}")
    else:
        st.error("Please provide a URL or upload an image!")

# Footer
st.write("Powered by Google Cloud Run & Gemini AI")