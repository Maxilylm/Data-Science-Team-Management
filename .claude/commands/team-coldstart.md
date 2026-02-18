---
name: team-coldstart
description: "Launch a full ML pipeline from raw data to deployed model. Orchestrates multiple agents through EDA, preprocessing, training, evaluation, and deployment stages."
user_invocable: true
aliases: ["team coldstart", "coldstart"]
---

# Team Cold Start - Full ML Pipeline Orchestration

You are launching a complete data science workflow from raw data to deployment. This skill orchestrates multiple specialized agents through all stages of the ML lifecycle.

## Overview

The `/team coldstart` command initiates an end-to-end ML pipeline:
1. **Initialize** - Set up project, validate data
2. **Analyze** - EDA, leakage review, feature recommendations
3. **Preprocess** - Build and validate preprocessing pipeline
4. **Train** - Train and compare models
5. **Evaluate** - Comprehensive model evaluation
6. **Productionalize** - Create production-ready code
7. **Deploy** - Deploy to target environment (optional)
8. **Finalize** - Generate reports, merge PRs

## Usage

```bash
# Full pipeline with default settings
/team coldstart data/raw/titanic.csv

# With specific target variable
/team coldstart data/raw/titanic.csv --target Survived

# Skip deployment stage
/team coldstart data/raw/titanic.csv --no-deploy

# Deploy to specific target
/team coldstart data/raw/titanic.csv --deploy-to snowflake
```

## Your Orchestration Workflow

### Stage 1: Initialize

**Actions:**
1. Create feature branch: `feature/ml-pipeline-{timestamp}`
2. Create task list for tracking progress
3. Validate input data exists
4. Invoke `data-steward` for initial data validation

**Tasks to Create:**
- [ ] Initialize project structure
- [ ] Validate input data quality
- [ ] Run exploratory data analysis
- [ ] Build preprocessing pipeline
- [ ] Train models
- [ ] Evaluate models
- [ ] Create production code
- [ ] Deploy (if requested)
- [ ] Generate final report

**Output:**
```markdown
## Stage 1: Initialize ✓

- Branch: feature/ml-pipeline-20240115-1030
- Data validated: data/raw/titanic.csv (891 rows, 12 columns)
- Quality check: PASSED (no critical issues)
```

### Stage 2: Analysis (Parallel)

**Invoke agents in parallel:**

1. **eda-analyst** - Comprehensive EDA
   ```
   Perform thorough exploratory data analysis on {data_path}.
   Generate statistics, visualizations, and identify data quality issues.
   Output: EDA report with recommendations
   ```

2. **ml-theory-advisor** - Early leakage review
   ```
   Review the dataset {data_path} for potential data leakage risks.
   Check for features that may contain target information.
   Output: Leakage assessment report
   ```

3. **feature-engineering-analyst** - Feature recommendations
   ```
   Analyze {data_path} and recommend feature engineering strategies.
   Consider domain knowledge and EDA findings.
   Output: Feature engineering recommendations
   ```

**Output:**
```markdown
## Stage 2: Analysis ✓

### EDA Summary
- Target: Survived (binary, 38% positive)
- Key features: Pclass, Sex, Age, Fare
- Missing values: Age (19.9%), Cabin (77.1%)
- Recommendations: Impute Age, drop Cabin

### Leakage Assessment
- No direct leakage detected
- Caution: Fare may have indirect relationship

### Feature Recommendations
1. Create family_size = SibSp + Parch + 1
2. Extract title from Name
3. Bin Age into categories
```

### Stage 3: Preprocessing

**Actions:**
1. Build preprocessing pipeline based on EDA findings
2. Invoke `ml-theory-advisor` to validate no leakage
3. Invoke `qa-test-agent` to generate unit tests
4. Create PR for preprocessing code
5. Invoke `brutal-code-reviewer` for code review
6. Merge PR after approval

**Code to generate:**
```python
# src/preprocessing.py
def preprocess(df):
    """Preprocess raw data for modeling."""
    # Implementation based on EDA recommendations
    ...
```

**Output:**
```markdown
## Stage 3: Preprocessing ✓

- Pipeline created: src/preprocessing.py
- Tests generated: tests/unit/test_preprocessing.py
- Coverage: 92%
- PR #1: Merged ✓
- Leakage check: PASSED
```

### Stage 4: Training

**Actions:**
1. Train baseline model (Logistic Regression)
2. Train advanced models (Random Forest, XGBoost)
3. Invoke `ml-theory-advisor` to review methodology
4. Create PR for training code
5. Merge after review

**Code to generate:**
```python
# src/model.py
def train_model(X, y, model_type='random_forest'):
    """Train and return model."""
    ...
```

**Output:**
```markdown
## Stage 4: Training ✓

### Models Trained
| Model | Accuracy | Precision | Recall | F1 |
|-------|----------|-----------|--------|-----|
| Logistic Regression | 0.79 | 0.76 | 0.72 | 0.74 |
| Random Forest | 0.84 | 0.82 | 0.78 | 0.80 |
| XGBoost | 0.85 | 0.83 | 0.79 | 0.81 |

Best model: XGBoost
PR #2: Merged ✓
```

### Stage 5: Evaluation

**Actions:**
1. Run comprehensive evaluation
2. Generate confusion matrix, ROC curve, feature importance
3. Invoke `ml-theory-advisor` to validate evaluation
4. Generate evaluation report

**Output:**
```markdown
## Stage 5: Evaluation ✓

### Best Model Performance
- Accuracy: 85%
- Precision: 83%
- Recall: 79%
- F1 Score: 81%
- AUC-ROC: 0.88

### Feature Importance
1. Sex_encoded (0.32)
2. Pclass (0.21)
3. Fare (0.18)
4. Age (0.15)
5. Family_size (0.08)

Methodology validated by ml-theory-advisor ✓
```

### Stage 6: Productionalization

**Actions:**
1. Invoke `mlops-engineer` to create production code
2. Create FastAPI prediction endpoint
3. Create Dockerfile
4. Invoke `qa-test-agent` for integration tests
5. Create PR for production code
6. Invoke `brutal-code-reviewer` for review
7. Merge after approval

**Files to generate:**
- `api/app.py` - FastAPI application
- `api/schemas.py` - Pydantic models
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Service orchestration

**Output:**
```markdown
## Stage 6: Productionalization ✓

- API created: api/app.py
- Docker configured: Dockerfile
- Integration tests: 85% coverage
- PR #3: Merged ✓
- Production checklist: PASSED
```

### Stage 7: Deployment (Optional)

**If deployment requested:**

1. Determine target (local, snowflake, streamlit-sis, aws, gcp)
2. Invoke appropriate agent:
   - **Local**: `mlops-engineer`
   - **Snowflake**: `snowflake-engineer`
   - **Cloud**: `mlops-engineer`

3. Invoke `frontend-ux-analyst` if dashboard included
4. Execute deployment
5. Verify health checks

**Output:**
```markdown
## Stage 7: Deployment ✓

- Target: snowflake
- Model registered: TITANIC_SURVIVAL_MODEL v1.0
- UDF created: PREDICT_SURVIVAL
- Dashboard: TITANIC_DASHBOARD
- Health check: PASSED
```

### Stage 8: Finalization

**Actions:**
1. Invoke `project-manager` to generate final report
2. Ensure all PRs merged to main
3. Update documentation
4. Close tasks

**Final Report:**
```markdown
## Project Complete: Titanic Survival Prediction

### Summary
- Duration: 45 minutes
- PRs Merged: 3
- Test Coverage: 87%
- Model Accuracy: 85%

### Artifacts
- Model: models/xgboost_v1.joblib
- API: http://localhost:8000
- Dashboard: Snowflake TITANIC_DASHBOARD

### Files Created
- src/preprocessing.py
- src/model.py
- api/app.py
- tests/unit/test_*.py
- tests/integration/test_api.py
- Dockerfile
- docker-compose.yml

### Next Steps
1. Monitor model performance in production
2. Set up data drift alerts
3. Plan for model retraining schedule
```

## Error Handling

If any stage fails:
1. Log the error with context
2. Attempt automatic remediation if possible
3. Create an issue for manual intervention
4. Continue with remaining independent stages
5. Report partial completion status

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `--target` | Auto-detect | Target variable name |
| `--no-deploy` | false | Skip deployment stage |
| `--deploy-to` | local | Deployment target |
| `--test-size` | 0.2 | Test split ratio |
| `--cv-folds` | 5 | Cross-validation folds |
| `--coverage-threshold` | 80 | Minimum test coverage |

## Agent Coordination

Throughout the workflow, use the `project-manager` agent to:
- Track progress via task list
- Coordinate agent handoffs
- Handle blockers and escalations
- Generate status updates

Invoke agents using the Task tool with appropriate prompts and context from previous stages.
