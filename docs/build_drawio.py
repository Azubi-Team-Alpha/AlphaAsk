import xml.etree.ElementTree as ET
from xml.dom import minidom

# Draw.io XML Builder for AlphaAsk Architecture
# Pristine, ultra-clean diagram with ZERO text on lines, spacious layout, and zero overlaps.

def create_drawio_xml():
    mxfile = ET.Element("mxfile", {
        "host": "app.diagrams.net",
        "modified": "2026-08-04T17:10:00.000Z",
        "agent": "Antigravity AI",
        "version": "21.6.8",
        "type": "device"
    })
    
    diagram = ET.SubElement(mxfile, "diagram", {
        "id": "alphaask-architecture-diagram",
        "name": "AlphaAsk Architecture"
    })
    
    model = ET.SubElement(diagram, "mxGraphModel", {
        "dx": "1600",
        "dy": "1000",
        "grid": "1",
        "gridSize": "10",
        "guides": "1",
        "tooltips": "1",
        "connect": "1",
        "arrows": "1",
        "fold": "1",
        "page": "1",
        "pageScale": "1",
        "pageWidth": "1700",
        "pageHeight": "1000",
        "background": "#FFFFFF",
        "math": "0",
        "shadow": "1"
    })
    
    root = ET.SubElement(model, "root")
    
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    def add_node(cell_id, value, style, x, y, w, h, parent="1"):
        cell = ET.SubElement(root, "mxCell", {
            "id": str(cell_id),
            "value": value,
            "style": style,
            "vertex": "1",
            "parent": str(parent)
        })
        ET.SubElement(cell, "mxGeometry", {
            "x": str(x),
            "y": str(y),
            "width": str(w),
            "height": str(h),
            "as": "geometry"
        })
        return cell

    # NO text on edges as requested by user
    def add_edge(edge_id, style, source, target, parent="1"):
        cell = ET.SubElement(root, "mxCell", {
            "id": str(edge_id),
            "value": "",
            "style": style,
            "edge": "1",
            "parent": str(parent),
            "source": str(source),
            "target": str(target)
        })
        ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})
        return cell

    # Text & Header Styles
    style_title = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=22;fontStyle=1;fontColor=#0F172A;"
    style_subtitle = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontColor=#475569;"

    # Container / Swimlane Styles
    style_boundary_aws = "swimlane;whiteSpace=wrap;html=1;strokeColor=#FF9900;fillColor=#FFFBEB;fontColor=#9A3412;fontStyle=1;fontSize=13;startSize=28;rounded=1;arcSize=3;strokeWidth=2;dashed=1;"
    style_boundary_vpc = "swimlane;whiteSpace=wrap;html=1;strokeColor=#0284C7;fillColor=#F0F9FF;fontColor=#0369A1;fontStyle=1;fontSize=12;startSize=26;rounded=1;arcSize=3;strokeWidth=1.5;dashed=1;"
    style_boundary_subnet = "swimlane;whiteSpace=wrap;html=1;strokeColor=#16A34A;fillColor=#F0FDF4;fontColor=#15803D;fontStyle=1;fontSize=11;startSize=24;rounded=1;arcSize=3;strokeWidth=1.5;dashed=1;"
    style_boundary_cicd = "swimlane;whiteSpace=wrap;html=1;strokeColor=#6366F1;fillColor=#EEF2FF;fontColor=#4338CA;fontStyle=1;fontSize=12;startSize=26;rounded=1;arcSize=3;strokeWidth=1.5;dashed=1;"
    style_boundary_ai = "swimlane;whiteSpace=wrap;html=1;strokeColor=#8B5CF6;fillColor=#F5F3FF;fontColor=#6D28D9;fontStyle=1;fontSize=12;startSize=26;rounded=1;arcSize=3;strokeWidth=1.5;dashed=1;"

    # Native AWS Shapes (Labels strictly positioned underneath icons, zero text overlap)
    base_aws_shape = "outlineConnect=0;fontColor=#334155;fontSize=11;fontStyle=1;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;spacingTop=6;labelBackgroundColor=none;"

    style_user = base_aws_shape + "shape=mxgraph.aws4.user;fillColor=#D97706;strokeColor=none;"
    style_cloudflare = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F97316;strokeColor=#EA580C;fontColor=#FFFFFF;fontStyle=1;fontSize=11;align=center;shadow=1;"
    style_cloudfront = base_aws_shape + "shape=mxgraph.aws4.cloudfront;fillColor=#8B5CF6;strokeColor=none;"
    style_s3 = base_aws_shape + "shape=mxgraph.aws4.s3;fillColor=#16A34A;strokeColor=none;"
    style_apigw = base_aws_shape + "shape=mxgraph.aws4.api_gateway;fillColor=#E11D48;strokeColor=none;"
    style_lambda = base_aws_shape + "shape=mxgraph.aws4.lambda;fillColor=#F97316;strokeColor=none;"
    style_elasticache = base_aws_shape + "shape=mxgraph.aws4.elasticache;fillColor=#DC2626;strokeColor=none;"
    style_dynamodb = base_aws_shape + "shape=mxgraph.aws4.dynamodb;fillColor=#2563EB;strokeColor=none;"
    style_bedrock = base_aws_shape + "shape=mxgraph.aws4.bedrock;fillColor=#0F172A;strokeColor=none;"
    style_ecr = base_aws_shape + "shape=mxgraph.aws4.ecr;fillColor=#EA580C;strokeColor=none;"
    style_cloudwatch = base_aws_shape + "shape=mxgraph.aws4.cloudwatch;fillColor=#D97706;strokeColor=none;"
    style_iam = base_aws_shape + "shape=mxgraph.aws4.permissions;fillColor=#DD6B20;strokeColor=none;"
    
    # Styled Service Nodes
    style_github = "rounded=1;whiteSpace=wrap;html=1;fillColor=#24292E;strokeColor=#1B1F23;fontColor=#FFFFFF;fontStyle=1;fontSize=11;align=center;shadow=1;"
    style_llm_groq = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F97316;strokeColor=#C2410C;fontColor=#FFFFFF;fontStyle=1;fontSize=11;align=center;shadow=1;"
    style_llm_gemini = "rounded=1;whiteSpace=wrap;html=1;fillColor=#2563EB;strokeColor=#1D4ED8;fontColor=#FFFFFF;fontStyle=1;fontSize=11;align=center;shadow=1;"
    style_llm_openrouter = "rounded=1;whiteSpace=wrap;html=1;fillColor=#6366F1;strokeColor=#4F46E5;fontColor=#FFFFFF;fontStyle=1;fontSize=11;align=center;shadow=1;"

    # Connector Styles (Clean lines, NO text)
    style_edge = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#475569;strokeWidth=2.5;endArrow=classic;endOffset=2;"
    style_edge_dashed = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#8B5CF6;strokeWidth=2;strokeDasharray=4 4;endArrow=classic;endOffset=2;"
    style_edge_failover = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#EF4444;strokeWidth=2;strokeDasharray=3 3;endArrow=classic;endOffset=2;"

    # 1. Title Block
    add_node(10, "AlphaAsk — Enterprise Serverless AI Platform Architecture", style_title, 400, 20, 800, 30)
    add_node(11, "System Topology: React SPA, Cloudflare DNS, CloudFront CDN, API Gateway, Lambda, ElastiCache Redis, DynamoDB & 4-Provider LLM Orchestrator", style_subtitle, 250, 52, 1100, 20)

    # 2. Client & Ingress Layer (Left) - Generous spacing (X offsets: 50, 180, 350, 520)
    add_node(20, "Student Clients\n(Desktop & Mobile)", style_user, 50, 240, 55, 55)
    add_node(21, "Cloudflare DNS & WAF\n(alphaask.alphateam.live)", style_cloudflare, 170, 240, 140, 55)
    add_node(22, "AWS CloudFront CDN\n(HTTPS Edge)", style_cloudfront, 360, 240, 55, 55)
    add_node(23, "Amazon S3 Bucket\n(Static React SPA)", style_s3, 360, 420, 55, 55)

    # 3. API Gateway Ingress (X = 520, completely separated from CloudFront)
    add_node(40, "Amazon API Gateway\n(HTTP API v2 / SSE)", style_apigw, 520, 240, 55, 55)

    # 4. CI/CD Deployment Pipeline (Top Right)
    add_node(30, "CI/CD Deployment Pipeline", style_boundary_cicd, 1020, 90, 580, 110)
    add_node(31, "GitHub Actions\nWorkflow", style_github, 1060, 125, 130, 50)
    add_node(32, "Amazon ECR\n(Docker Image)", style_ecr, 1480, 125, 50, 50)

    # 5. AWS Cloud Region (us-east-1) (X = 610 to 1640)
    add_node(50, "AWS Cloud Region (us-east-1)", style_boundary_aws, 610, 220, 1030, 710)

    # 6. VPC Container
    add_node(60, "Amazon VPC (10.0.0.0/16)", style_boundary_vpc, 640, 265, 470, 350)

    # 7. Subnet Container
    add_node(70, "Private Application Subnet", style_boundary_subnet, 660, 300, 430, 295)

    # Backend Services inside VPC Subnet (Spaced out X = 700 vs 980)
    add_node(80, "AWS Lambda Backend\n(FastAPI / Mangum)", style_lambda, 700, 350, 55, 55)
    add_node(90, "Amazon ElastiCache Redis\n(Rate Limit & Session Cache)", style_elasticache, 980, 350, 55, 55)

    # 8. DynamoDB Layer (Inside AWS Cloud, Outside VPC)
    add_node(100, "Amazon DynamoDB (Serverless NoSQL Database)", style_boundary_aws, 640, 640, 470, 240)
    add_node(101, "DynamoDB Tables\n(Users, Sessions, Messages, Questions, FAQ)", style_dynamodb, 850, 700, 55, 55)

    # 9. Multi-Provider 4-LLM Orchestrator Container (Right Side, X = 1140 to 1600)
    add_node(110, "4-Provider LLM Orchestrator Engine", style_boundary_ai, 1140, 265, 470, 440)

    add_node(120, "AWS Bedrock\n(Claude 3.5 Sonnet)", style_bedrock, 1180, 310, 55, 55)
    add_node(121, "Groq Cloud API\n(Llama-3.3 70B Fast Stream)", style_llm_groq, 1380, 310, 190, 55)
    add_node(122, "Google Gemini API\n(Gemini 2.5 / 2.0 Flash)", style_llm_gemini, 1180, 470, 170, 55)
    add_node(123, "OpenRouter API\n(DeepSeek-R1 / GPT-4o)", style_llm_openrouter, 1380, 470, 190, 55)

    # 10. Observability & Security (IAM & CloudWatch)
    add_node(130, "Amazon CloudWatch\n(Logs & Metrics)", style_cloudwatch, 1180, 730, 55, 55)
    add_node(131, "AWS IAM Execution Role\n(Security Policies)", style_iam, 1390, 730, 55, 55)

    # CONNECTORS (CLEAN LINES - ZERO TEXT ON CONNECTORS)
    add_edge(200, style_edge, "20", "21")
    add_edge(201, style_edge, "21", "22")
    add_edge(202, style_edge, "22", "23")
    add_edge(203, style_edge, "22", "40")
    add_edge(204, style_edge, "40", "80")

    add_edge(205, style_edge, "80", "90")
    add_edge(206, style_edge, "80", "101")

    # 4 LLM Orchestrator Edges
    add_edge(207, style_edge, "80", "120")
    add_edge(208, style_edge, "80", "121")
    add_edge(209, style_edge_failover, "80", "122")
    add_edge(210, style_edge_failover, "80", "123")

    # CI/CD Flow
    add_edge(211, style_edge, "31", "32")
    add_edge(212, style_edge_dashed, "32", "80")

    # Observability & Security
    add_edge(213, style_edge_dashed, "80", "130")
    add_edge(214, style_edge_dashed, "131", "80")

    xml_str = minidom.parseString(ET.tostring(mxfile, encoding="utf-8")).toprettyxml(indent="  ")
    return xml_str

xml_content = create_drawio_xml()

with open("/home/haadi/Desktop/AWS Cloud/Azubi-AWS-AI/Team Alpha/alphaask/docs/alphaask-architecture.drawio", "w") as f:
    f.write(xml_content)

print("Pristine Draw.io XML (0 line text, spacious layout) created at docs/alphaask-architecture.drawio")
