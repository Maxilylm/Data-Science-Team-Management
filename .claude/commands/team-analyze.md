---
name: team-analyze
description: "Run a quick analysis workflow without the full ML pipeline. Performs EDA, leakage review, and provides feature recommendations."
user_invocable: true
aliases: ["team analyze", "analyze"]
---

# Team Analyze - Quick Analysis Workflow

You are running a quick analysis workflow that provides comprehensive data understanding without building a full ML pipeline. This is useful for:
- Initial data exploration
- Feasibility assessments
- Quick insights for stakeholders
- Pre-project planning

## Overview

The `/team analyze` command runs analysis stages only:
1. **EDA** - Comprehensive exploratory data analysis
2. **Leakage Review** - Identify potential data leakage risks
3. **Feature Recommendations** - Suggest feature engineering strategies
4. **Summary Report** - Consolidated findings and recommendations

## Usage

```bash
# Analyze a dataset
/team analyze data/raw/titanic.csv

# With specific target variable
/team analyze data/raw/titanic.csv --target Survived

# Focus on specific analysis
/team analyze data/raw/titanic.csv --focus eda
/team analyze data/raw/titanic.csv --focus leakage
/team analyze data/raw/titanic.csv --focus features

# Generate visualizations
/team analyze data/raw/titanic.csv --visualize
```

## Your Analysis Workflow

### Step 1: Data Validation

Before analysis, validate the data:

```python
import pandas as pd

# Load and validate
df = pd.read_csv(data_path)
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"Dtypes: {df.dtypes.value_counts().to_dict()}")
```

**Checks:**
- File exists and is readable
- Has at least 2 columns and 10 rows
- Columns have interpretable names
- No entirely empty columns

### Step 2: EDA (Invoke eda-analyst)

**Prompt for eda-analyst:**
```
Perform comprehensive exploratory data analysis on {data_path}.

Focus on:
1. Data Overview
   - Shape, columns, data types
   - First/last rows preview

2. Data Quality
   - Missing values by column
   - Duplicate rows
   - Constant columns

3. Statistical Summary
   - Numerical: mean, std, quartiles, outliers
   - Categorical: unique values, mode, frequency

4. Distribution Analysis
   - Histograms for numerical
   - Bar charts for categorical
   - Target distribution (if identified)

5. Correlation Analysis
   - Correlation matrix
   - Highly correlated pairs (>0.8)

Output a structured report with findings and recommendations.
```

**Expected Output:**
```markdown
### EDA Report

#### Data Overview
- Rows: 891
- Columns: 12
- Memory: 84 KB

#### Data Quality Issues
| Issue | Count | Columns |
|-------|-------|---------|
| Missing Values | 3 | Age, Cabin, Embarked |
| Duplicates | 0 | - |
| High Cardinality | 2 | Name, Ticket |

#### Key Statistics
| Feature | Type | Unique | Missing % | Notes |
|---------|------|--------|-----------|-------|
| Survived | int | 2 | 0% | Target (38% positive) |
| Pclass | int | 3 | 0% | Strong predictor |
| Sex | str | 2 | 0% | Strong predictor |
| Age | float | 88 | 19.9% | Needs imputation |

#### Recommendations
1. Impute Age using median by Pclass
2. Drop Cabin (77% missing)
3. Consider Name for title extraction
```

### Step 3: Leakage Review (Invoke ml-theory-advisor)

**Prompt for ml-theory-advisor:**
```
Review the dataset {data_path} for potential data leakage.

Check for:
1. Target Leakage
   - Features derived from target
   - Features only known after the event

2. Train-Test Leakage
   - Time-based features that could leak
   - ID-based relationships

3. Feature Leakage
   - Aggregations computed on full dataset
   - Future information encoded

4. Indirect Leakage
   - Proxy variables for target
   - Highly correlated features

Provide specific examples and remediation strategies.
```

**Expected Output:**
```markdown
### Leakage Assessment

#### Risk Level: LOW

#### Findings

| Feature | Risk | Type | Recommendation |
|---------|------|------|----------------|
| Fare | Low | Indirect | Monitor correlation |
| Cabin | None | - | Safe to use |
| Ticket | Low | ID-based | Consider dropping |

#### Safe Features
- Pclass, Sex, Age, SibSp, Parch, Embarked

#### Warnings
- None critical

#### Recommendations
1. Use proper cross-validation
2. Fit preprocessing only on training data
3. Monitor feature importance for anomalies
```

### Step 4: Feature Recommendations (Invoke feature-engineering-analyst)

**Prompt for feature-engineering-analyst:**
```
Analyze {data_path} and recommend feature engineering strategies.

Consider:
1. Domain Knowledge
   - What features make sense for this problem?
   - What interactions might be meaningful?

2. Missing Value Strategies
   - Imputation methods by feature type
   - Indicator variables for missingness

3. Encoding Strategies
   - Categorical encoding options
   - Binning for numerical features

4. Feature Creation
   - Combinations and interactions
   - Aggregations
   - Domain-specific transformations

5. Feature Selection
   - Candidates for removal
   - Importance-based selection

Provide specific, implementable recommendations.
```

**Expected Output:**
```markdown
### Feature Engineering Recommendations

#### New Features to Create

1. **family_size** = SibSp + Parch + 1
   - Rationale: Total family members aboard
   - Expected impact: Medium

2. **is_alone** = 1 if family_size == 1 else 0
   - Rationale: Solo travelers may have different survival rate
   - Expected impact: Low-Medium

3. **title** = extracted from Name
   - Rationale: Social status indicator
   - Expected impact: High

4. **age_group** = binned Age (child/adult/senior)
   - Rationale: Non-linear age effects
   - Expected impact: Medium

5. **fare_per_person** = Fare / family_size
   - Rationale: Actual individual fare
   - Expected impact: Medium

#### Encoding Recommendations

| Feature | Strategy | Rationale |
|---------|----------|-----------|
| Sex | Binary (0/1) | Only 2 values |
| Embarked | One-hot | 3 unordered categories |
| Pclass | Ordinal or one-hot | Could be either |
| Title | Target encoding | Many categories |

#### Features to Drop
- PassengerId (ID only)
- Name (after title extraction)
- Ticket (high cardinality, low value)
- Cabin (77% missing)
```

### Step 5: Summary Report

Compile findings into a comprehensive report:

```markdown
# Analysis Report: {dataset_name}

## Executive Summary
Brief overview of the dataset and key findings.

## Data Quality
Summary of quality issues and recommended actions.

## Target Variable
Distribution and characteristics of the prediction target.

## Key Features
Top predictive features based on analysis.

## Risk Assessment
Data leakage risks and mitigation strategies.

## Feature Engineering Plan
Prioritized list of features to create.

## Recommendations
1. Immediate actions
2. Modeling suggestions
3. Data collection improvements

## Next Steps
- Run `/team coldstart` for full pipeline
- Or address specific issues first
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `--target` | Auto-detect | Target variable name |
| `--focus` | all | Focus area (eda, leakage, features) |
| `--visualize` | false | Generate visualization files |
| `--output` | reports/ | Output directory for report |
| `--format` | markdown | Report format (md, html, pdf) |

## Agent Coordination

This skill coordinates:
1. **eda-analyst** - Data exploration
2. **ml-theory-advisor** - Leakage assessment
3. **feature-engineering-analyst** - Feature recommendations

Agents run in parallel where possible for efficiency.

## Output Files

Generated files:
- `reports/eda_report_{timestamp}.md` - EDA findings
- `reports/analysis_summary_{timestamp}.md` - Combined report
- `reports/figures/` - Visualizations (if --visualize)
