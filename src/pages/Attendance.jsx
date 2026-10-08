import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

function Attendance() {
  const subjects = [
    {
      name: "Data Structures",
      attended: 42,
      total: 48,
      percentage: 88
    },
    {
      name: "Operating Systems",
      attended: 38,
      total: 50,
      percentage: 76
    },
    {
      name: "Database Management",
      attended: 42,
      total: 50,
      percentage: 84
    },
    {
      name: "Computer Networks",
      attended: 39,
      total: 49,
      percentage: 79
    },
    {
      name: "Web Technology",
      attended: 41,
      total: 45,
      percentage: 91
    }
  ];

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="page-label">ACADEMICS</p>

          <h1>Attendance</h1>

          <p>
            Track your subject-wise attendance and stay ahead of
            attendance shortage.
          </p>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="attendance-summary">

        <div className="summary-card">
          <div className="summary-icon blue">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>Overall Attendance</span>
            <h2>82%</h2>
            <p>Current semester</p>
          </div>
        </div>


        <div className="summary-card">
          <div className="summary-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Present</span>
            <h2>202</h2>
            <p>Total classes attended</p>
          </div>
        </div>


        <div className="summary-card">
          <div className="summary-icon orange">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>Attendance Alert</span>
            <h2>1</h2>
            <p>Subject needs attention</p>
          </div>
        </div>

      </div>


      {/* Subject Attendance */}
      <div className="attendance-card">

        <div className="card-header">
          <div>
            <h2>Subject-wise Attendance</h2>

            <p>
              Your attendance for the current semester
            </p>
          </div>
        </div>


        <div className="attendance-list">

          {subjects.map((subject) => (

            <div
              className="attendance-item"
              key={subject.name}
            >

              <div className="subject-info">

                <strong>
                  {subject.name}
                </strong>

                <span>
                  {subject.attended} / {subject.total} classes
                </span>

              </div>


              <div className="attendance-progress">

                <div className="progress-background">

                  <div
                    className={`progress-fill ${
                      subject.percentage < 75
                        ? "danger"
                        : ""
                    }`}
                    style={{
                      width: `${subject.percentage}%`
                    }}
                  />

                </div>

              </div>


              <strong className="attendance-percentage">
                {subject.percentage}%
              </strong>

            </div>

          ))}

        </div>

      </div>


      {/* UNEXA Insight */}
      <div className="attendance-insight">

        <TrendingUp size={22} />

        <div>

          <strong>
            UNEXA Insight
          </strong>

          <p>
            Your Operating Systems attendance is currently
            76%. Attend your upcoming classes regularly to
            maintain a safe attendance level.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Attendance;