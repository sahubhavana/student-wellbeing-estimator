
import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentData(BaseModel):
    Age: int = Field(..., ge=10, le=100)
    Gender: Literal["Male", "Female"]
    Country: str

    Academic_Level: Literal[
        "Undergraduate", "Graduate", "High_School"
    ]

    Most_Used_Platform: Literal[
        "Facebook", "LinkedIn", "Instagram", "Snapchat",
        "Twitter", "YouTube", "TikTok", "LINE",
        "KakaoTalk", "VKontakte", "WhatsApp", "WeChat"
    ]

    Purpose_Of_Use: Literal[
        "Networking", "Education", "Entertainment", "News"
    ]

    Avg_Daily_Usage_Hours: float
    Daily_Unlocks: int
    Study_Hours: float
    Physical_Activity_Hours: float
    Sleep_Hours_Per_Night: float

    Stress_Level: Literal[
        "Medium", "Low", "Very High", "High"
    ]


model = joblib.load(
    r"C:\Users\DELL\Desktop\Machine learning content\Mental health project\Mental_Health_model.pkl"
)

top_countries = [
    "Other", "India", "USA", "Canada", "Australia",
    "UK", "Germany", "Mexico", "Turkey", "France"
]


class PredictResponse(BaseModel):
    predict_mental_health_score: float


@app.get("/")
def home():
    return {"message": "Mental Health Prediction API is running"}


@app.post("/predict", response_model=PredictResponse)
def predict(data: StudentData):

    country = (
        data.Country
        if data.Country in top_countries
        else "Other"
    )

    input_row = pd.DataFrame([{
        "Study_Hours": data.Study_Hours,
        "Age": data.Age,
        "Avg_Daily_Usage_Hours": data.Avg_Daily_Usage_Hours,
        "Daily_Unlocks": data.Daily_Unlocks,
        "Physical_Activity_Hours": data.Physical_Activity_Hours,
        "Sleep_Hours_Per_Night": data.Sleep_Hours_Per_Night,
        "Stress_Level": data.Stress_Level,
        "Gender": data.Gender,
        "Academic_Level": data.Academic_Level,
        "Most_Used_Platform": data.Most_Used_Platform,
        "Purpose_Of_Use": data.Purpose_Of_Use,
        "group_country": country
    }])

    prediction = model.predict(input_row)[0]

    return PredictResponse(
        predict_mental_health_score=round(float(prediction), 2)
    )
