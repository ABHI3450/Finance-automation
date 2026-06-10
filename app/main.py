import streamlit as st
import pandas as pd
from sqlalchemy import create_engine

# ---------------------------------
# PAGE CONFIG
# ---------------------------------

st.set_page_config(
    page_title="Galaxy Finance AI",
    page_icon="🌌",
    layout="wide"
)

# ---------------------------------
# THEME TOGGLE
# ---------------------------------

dark_mode = st.sidebar.toggle(
    "🌙 Dark Mode",
    value=True
)

if dark_mode:

    text_color = "white"

    card_color = "rgba(255,255,255,0.08)"

    page_bg = """
        radial-gradient(
            circle at center,
            #0b1026 0%,
            #040814 45%,
            #000000 100%
        )
    """

else:

    text_color = "#111827"

    card_color = "rgba(255,255,255,0.75)"

    page_bg = "#faf7f2"

# ---------------------------------
# GALAXY BACKGROUND
# ---------------------------------

st.markdown(
    f"""
<div class="space-bg">
    <div class="stars"></div>
    <div class="stars2"></div>
    <div class="nebula"></div>
</div>

<style>

/* background */

.space-bg {{

    position: fixed;
    inset: 0;

    z-index: -999;

    overflow: hidden;

    background: {page_bg};
}}

/* stars */

.stars,
.stars2 {{

    position: absolute;

    width: 200%;
    height: 200%;

    background-image:
        radial-gradient(
            white 1px,
            transparent 1px
        );
}}

/* slow */

.stars {{

    background-size: 35px 35px;

    opacity: .35;

    animation:
        moveStars 60s linear infinite;
}}

/* fast */

.stars2 {{

    background-size: 20px 20px;

    opacity: .25;

    animation:
        moveStarsFast 25s linear infinite;
}}

/* nebula */

.nebula {{

    position: absolute;

    width: 100%;
    height: 100%;

    background:

        radial-gradient(
            circle at 20% 30%,
            rgba(123,97,255,.35),
            transparent 30%
        ),

        radial-gradient(
            circle at 75% 70%,
            rgba(0,191,255,.25),
            transparent 30%
        ),

        radial-gradient(
            circle at 50% 50%,
            rgba(255,0,150,.15),
            transparent 35%
        );

    filter: blur(80px);

    animation:
        nebulaMove 18s ease-in-out infinite;
}}

/* animation */

@keyframes moveStars {{

    from {{
        transform: translateY(0);
    }}

    to {{
        transform: translateY(-1200px);
    }}
}}

@keyframes moveStarsFast {{

    from {{
        transform: translateY(0);
    }}

    to {{
        transform: translateY(-2200px);
    }}
}}

@keyframes nebulaMove {{

    0% {{
        transform: translate(0,0);
    }}

    50% {{
        transform: translate(40px,-30px);
    }}

    100% {{
        transform: translate(0,0);
    }}
}}

/* cards */

div[data-testid="metric-container"],
div[data-testid="stFileUploader"],
div[data-testid="stDataFrame"] {{

    background:{card_color};

    border-radius:20px;

    padding:15px;

    backdrop-filter: blur(18px);

    box-shadow:
        0 8px 30px rgba(0,0,0,.18);
}}

/* buttons */

button {{

    background:#6d28d9 !important;

    color:white !important;

    border:none !important;

    border-radius:14px !important;
}}

/* text */

h1,h2,h3,p,label,span {{

    color:{text_color} !important;
}}

</style>
""",
    unsafe_allow_html=True
)

# ---------------------------------
# HEADER
# ---------------------------------

st.title("🌌 Galaxy Finance AI")

st.caption(
    "Travel through your financial universe"
)

# ---------------------------------
# FILE UPLOAD
# ---------------------------------

uploaded_file = st.file_uploader(
    "Upload bank statement CSV",
    type=["csv"]
)

# ---------------------------------
# APP
# ---------------------------------

if uploaded_file:

    df = pd.read_csv(uploaded_file)
    st.write("Columns Found:")
    st.write(df.columns.tolist())

    st.write("First 5 Rows:")
    st.dataframe(df.head())
    # -------------------------
    # SIMPLE FORMAT
    # date,merchant,amount
    # -------------------------

    if {"date", "merchant", "amount"}.issubset(df.columns):

        df["date"] = pd.to_datetime(df["date"])
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

        def categorize(merchant):

            merchant = str(merchant).lower()

            if "uber" in merchant:
                return "Transport"

            elif "swiggy" in merchant:
                return "Food"

            elif "amazon" in merchant:
                return "Shopping"

            elif "netflix" in merchant:
                return "Subscription"

            elif "flipkart" in merchant:
                return "Shopping"

            elif "zomato" in merchant:
                return "Food"

            else:
                return "Other"

        df["category"] = df["merchant"].apply(categorize)

        total = df["amount"].sum()
        avg = round(df["amount"].mean(), 2)
        count = len(df)

        chart_column = "amount"

    # -------------------------
    # COMPLEX FORMAT
    # Date,Transaction_ID,
    # Description,Category,
    # Amount,Type,Balance
    # -------------------------

    elif {"Date", "Amount", "Type"}.issubset(df.columns):

        df["Date"] = pd.to_datetime(df["Date"])

        df["Amount"] = pd.to_numeric(
            df["Amount"],
            errors="coerce"
        )

        total = (
            df[df["Type"] == "Debit"]
            ["Amount"]
            .sum()
        )

        avg = round(
            df["Amount"].mean(),
            2
        )

        count = len(df)

        chart_column = "Amount"

    else:

        st.error(
            """
            Unsupported CSV format.

            Use either:

            date,merchant,amount

            OR

            Date,Transaction_ID,
            Description,Category,
            Amount,Type,Balance
            """
        )

        st.stop()

    # -------------------------
    # METRICS
    # -------------------------

    c1, c2, c3 = st.columns(3)

    with c1:
        st.metric(
            "💰 Total Spending",
            f"₹{total:,.0f}"
        )

    with c2:
        st.metric(
            "📄 Transactions",
            count
        )

    with c3:
        st.metric(
            "📊 Average",
            f"₹{avg:,.0f}"
        )

    # -------------------------
    # DATA
    # -------------------------

    st.subheader("🧾 Transactions")

    st.dataframe(
        df,
        use_container_width=True
    )

    # -------------------------
    # CHARTS
    # -------------------------

    st.subheader("📈 Expense Summary")

    if "category" in df.columns:

        totals = (
            df.groupby("category")
            [chart_column]
            .sum()
        )

        st.bar_chart(totals)

    elif "Category" in df.columns:

        totals = (
            df.groupby("Category")
            [chart_column]
            .sum()
        )

        st.bar_chart(totals)

    # -------------------------
    # ALERTS
    # -------------------------

    threshold = (
        df[chart_column].mean()
        + df[chart_column].std()
    )

    alerts = df[
        df[chart_column] > threshold
    ]

    st.subheader("🚨 Alerts")

    if not alerts.empty:

        st.warning(
            "Suspicious transactions detected"
        )

        st.dataframe(
            alerts,
            use_container_width=True
        )

    else:

        st.success(
            "No suspicious activity"
        )

    # -------------------------
    # DOWNLOAD
    # -------------------------

    csv = df.to_csv(
        index=False
    )

    st.download_button(
        "⬇ Download Report",
        csv,
        "finance_report.csv",
        "text/csv"
    )

    # -------------------------
    # SAVE TO POSTGRES
    # -------------------------

    try:

        engine = create_engine(
            "postgresql://postgres:Abhi0987@localhost:5432/finance"
        )

        df.to_sql(
            "transactions",
            engine,
            if_exists="append",
            index=False
        )

    except Exception:
        pass
