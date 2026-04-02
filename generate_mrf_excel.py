import xml.etree.ElementTree as ET

def create_excel_xml():
    workbook = ET.Element('Workbook')
    workbook.set('xmlns', 'urn:schemas-microsoft-com:office:spreadsheet')
    workbook.set('xmlns:o', 'urn:schemas-microsoft-com:office:office')
    workbook.set('xmlns:x', 'urn:schemas-microsoft-com:office:excel')
    workbook.set('xmlns:ss', 'urn:schemas-microsoft-com:office:spreadsheet')
    workbook.set('xmlns:html', 'http://www.w3.org/TR/REC-html40')

    styles = ET.SubElement(workbook, 'Styles')
    style_header = ET.SubElement(styles, 'Style')
    style_header.set('ss:ID', 'Header')
    bold_font = ET.SubElement(style_header, 'Font')
    bold_font.set('ss:Bold', '1')

    # Data for the first worksheet: Peer Comparison
    headers_peer = ["S.No.", "Name", "CMP Rs.", "P/E", "Mar Cap Rs.Cr.", "Div Yld %", "NP Qtr Rs.Cr.", "Qtr Profit Var %", "Sales Qtr Rs.Cr.", "Qtr Sales Var %", "ROCE %"]
    data_peer = [
        ["1", "MRF", "129575.00", "24.03", "54960.56", "0.18", "691.83", "137.49", "8050.43", "14.99", "13.62"],
        ["2", "Balkrishna Inds", "2150.50", "31.63", "41503.31", "0.74", "382.15", "-14.98", "2736.79", "6.89", "16.67"],
        ["3", "Apollo Tyres", "412.45", "17.92", "26182.26", "1.21", "470.52", "43.44", "7743.08", "11.77", "11.44"],
        ["4", "CEAT", "3462.90", "22.50", "14012.20", "0.87", "155.40", "101.61", "4157.05", "25.98", "15.40"],
        ["5", "JK Tyre & Indust", "398.40", "15.74", "11478.40", "0.75", "207.73", "271.28", "4222.96", "14.95", "12.78"],
        ["6", "TVS Srichakra", "3435.60", "55.88", "2619.28", "0.49", "11.18", "743.96", "916.51", "14.17", "5.36"],
        ["7", "Goodyear India", "687.15", "27.97", "1585.26", "3.48", "24.63", "159.81", "606.91", "-3.93", "13.01"],
        ["Median: 13 Co.", "-", "398.40", "24.03", "1585.26", "0.74", "11.18", "116.90", "606.91", "12.97", "13.03"]
    ]

    # Data for the second worksheet: Quarterly Results
    headers_qr = ["Metric", "Dec 2022", "Mar 2023", "Jun 2023", "Sep 2023", "Dec 2023", "Mar 2024", "Jun 2024", "Sep 2024", "Dec 2024", "Mar 2025", "Jun 2025", "Sep 2025", "Dec 2025"]
    data_qr = [
        ["Sales", "5645", "5842", "6440", "6217", "6162", "6349", "7196", "6881", "7001", "7075", "7676", "7379", "8050"],
        ["Expenses", "5083", "4988", "5310", "5060", "5108", "5437", "6037", "5870", "6166", "5996", "6604", "6253", "6651"],
        ["Operating Profit", "562", "854", "1130", "1157", "1055", "912", "1160", "1011", "835", "1079", "1071", "1126", "1399"],
        ["OPM %", "10%", "15%", "18%", "19%", "17%", "14%", "16%", "15%", "12%", "15%", "14%", "15%", "17%"],
        ["Other Income", "71", "70", "75", "71", "78", "94", "84", "113", "98", "113", "126", "108", "47"],
        ["Interest", "86", "92", "84", "86", "90", "93", "85", "84", "94", "98", "98", "90", "91"],
        ["Depreciation", "316", "330", "333", "351", "360", "385", "396", "410", "415", "433", "429", "445", "438"],
        ["Profit before tax", "231", "501", "787", "791", "682", "527", "763", "631", "424", "661", "670", "699", "917"]
    ]

    # Data for the third worksheet: Profit & Loss
    headers_pl = ["Metric", "Sep 2013", "Sep 2014", "Mar 2016 18m", "Mar 2017", "Mar 2018", "Mar 2019", "Mar 2020", "Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024", "Mar 2025", "TTM"]
    data_pl = [
        ["Sales", "12248", "13329", "20179", "13412", "14954", "16062", "16237", "16162", "19317", "23008", "25169", "28152", "30180"],
        ["Expenses", "10468", "11384", "15743", "10763", "12665", "13744", "13855", "13208", "17256", "20604", "20896", "24058", "25505"],
        ["Operating Profit", "1780", "1945", "4437", "2649", "2288", "2317", "2382", "2954", "2061", "2404", "4272", "4095", "4675"],
        ["OPM %", "15%", "15%", "22%", "20%", "15%", "14%", "15%", "18%", "11%", "10%", "17%", "15%", "15%"],
        ["Other Income", "25", "63", "317", "327", "330", "416", "335", "205", "315", "245", "306", "406", "395"],
        ["Interest", "196", "232", "361", "257", "259", "273", "301", "282", "263", "326", "361", "368", "378"],
        ["Depreciation", "374", "424", "737", "611", "707", "808", "982", "1141", "1205", "1253", "1430", "1654", "1745"],
        ["Profit before tax", "1235", "1353", "3656", "2109", "1653", "1652", "1434", "1737", "908", "1070", "2787", "2479", "2947"],
        ["Tax %", "35%", "33%", "31%", "30%", "32%", "32%", "1%", "26%", "26%", "28%", "25%", "25%", ""],
        ["Net Profit", "809", "908", "2509", "1486", "1132", "1131", "1423", "1277", "669", "769", "2081", "1869", "2230"],
        ["EPS in Rs", "1906.58", "2141.71", "5916.93", "3504.33", "2668.20", "2665.82", "3354.22", "3011.15", "1577.96", "1813.04", "4907.26", "4407.54", "5258.19"],
        ["Dividend Payout %", "2%", "2%", "2%", "2%", "2%", "2%", "3%", "5%", "10%", "10%", "4%", "5%", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Compounded Sales Growth", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["10 Years:", "8%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["5 Years:", "12%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["3 Years:", "13%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["TTM:", "10%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Compounded Profit Growth", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["10 Years:", "8%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["5 Years:", "6%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["3 Years:", "50%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["TTM:", "30%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Stock Price CAGR", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["10 Years:", "13%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["5 Years:", "10%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["3 Years:", "16%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["1 Year:", "14%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Return on Equity", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["10 Years:", "12%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["5 Years:", "9%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["3 Years:", "10%", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Last Year:", "11%", "", "", "", "", "", "", "", "", "", "", "", ""]
    ]

    # Data for the fourth worksheet: Balance Sheet
    headers_bs = ["Metric", "Sep 2013", "Sep 2014", "Mar 2016", "Mar 2017", "Mar 2018", "Mar 2019", "Mar 2020", "Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024", "Mar 2025", "Sep 2025"]
    data_bs = [
        ["Equity Capital", "4", "4", "4", "4", "4", "4", "4", "4", "4", "4", "4", "4", "4"],
        ["Reserves", "3651", "4535", "7220", "8637", "9734", "10833", "12210", "13409", "14028", "14703", "16699", "18484", "19437"],
        ["Borrowings", "1599", "1903", "2464", "2333", "2163", "2506", "1854", "2388", "3229", "3014", "2822", "3771", "3631"],
        ["Other Liabilities", "3023", "3391", "3566", "4075", "4577", "5098", "5373", "6780", "5799", "6648", "7325", "7307", "7248"],
        ["Total Liabilities", "8278", "9833", "13254", "15048", "16478", "18441", "19442", "22582", "23060", "24369", "26849", "29567", "30320"],
        ["Fixed Assets", "2974", "3436", "4608", "5502", "6092", "6786", "8870", "9441", "9522", "10118", "12046", "13221", "13114"],
        ["CWIP", "359", "628", "1059", "848", "1079", "1403", "1741", "1002", "1233", "3046", "2385", "1169", "949"],
        ["Investments", "904", "1081", "3138", "3382", "4145", "3855", "1519", "5874", "3656", "3085", "3383", "4548", "4597"],
        ["Other Assets", "4041", "4688", "4448", "5316", "5162", "6397", "7312", "6265", "8648", "8120", "9036", "10629", "11660"],
        ["Total Assets", "8278", "9833", "13254", "15048", "16478", "18441", "19442", "22582", "23060", "24369", "26849", "29567", "30320"]
    ]

    # Data for the fifth worksheet: Cash Flows
    headers_cf = ["Metric", "Sep 2013", "Sep 2014", "Mar 2016", "Mar 2017", "Mar 2018", "Mar 2019", "Mar 2020", "Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024", "Mar 2025"]
    data_cf = [
        ["Cash from Operating Activity", "1499", "1699", "3043", "1956", "2413", "1253", "2271", "4325", "-578", "2755", "3300", "1868"],
        ["Cash from Investing Activity", "-959", "-1791", "-3408", "-1393", "-2014", "-1386", "-162", "-5087", "169", "-1922", "-2378", "-2082"],
        ["Cash from Financing Activity", "-313", "67", "212", "-438", "-453", "42", "-1032", "-250", "424", "-840", "-868", "282"],
        ["Net Cash Flow", "228", "-24", "-152", "125", "-53", "-91", "1077", "-1012", "14", "-6", "55", "68"]
    ]

    # Data for the sixth worksheet: Ratios
    headers_rt = ["Metric", "Sep 2013", "Sep 2014", "Mar 2016", "Mar 2017", "Mar 2018", "Mar 2019", "Mar 2020", "Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024", "Mar 2025"]
    data_rt = [
        ["Debtor Days", "46", "47", "33", "54", "52", "54", "52", "48", "44", "40", "42", "44"],
        ["Inventory Days", "83", "79", "62", "118", "88", "113", "110", "115", "120", "98", "108", "115"],
        ["Days Payable", "47", "50", "36", "69", "63", "64", "72", "129", "60", "58", "64", "57"],
        ["Cash Conversion Cycle", "83", "76", "58", "103", "78", "102", "90", "34", "104", "80", "86", "101"],
        ["Working Capital Days", "36", "30", "1", "4", "-1", "2", "5", "-41", "10", "-8", "3", "8"],
        ["ROCE %", "29%", "27%", "49%", "23%", "17%", "15%", "13%", "14%", "6%", "7%", "16%", "14%"]
    ]

    # Data structure placeholders for remaining sheets
    other_sheets = {
        "Insights (In beta)": ["Insight", "Value"],
        "Shareholding Pattern": ["Category", "Dec 2022", "Mar 2023", "Jun 2023", "Sep 2023"],
        "Documents": ["Date", "Document Type", "Link"]
    }

    def add_worksheet(name, headers, rows):
        worksheet = ET.SubElement(workbook, 'Worksheet')
        safe_name = name.replace("&", "and")
        worksheet.set('ss:Name', safe_name)
        table = ET.SubElement(worksheet, 'Table')
        
        header_row = ET.SubElement(table, 'Row')
        for h in headers:
            cell = ET.SubElement(header_row, 'Cell')
            cell.set('ss:StyleID', 'Header')
            data = ET.SubElement(cell, 'Data')
            data.set('ss:Type', 'String')
            data.text = str(h)
            
        for row in rows:
            data_row = ET.SubElement(table, 'Row')
            for col in row:
                cell = ET.SubElement(data_row, 'Cell')
                data = ET.SubElement(cell, 'Data')
                data.set('ss:Type', 'String')
                data.text = str(col) if col else ""

    # Add all populated sheets
    add_worksheet("Peer comparison", headers_peer, data_peer)
    add_worksheet("Quarterly Results", headers_qr, data_qr)
    add_worksheet("Profit & Loss", headers_pl, data_pl)
    add_worksheet("Balance Sheet", headers_bs, data_bs)
    add_worksheet("Cash Flows", headers_cf, data_cf)
    add_worksheet("Ratios", headers_rt, data_rt)

    # Adding remaining sheets with placeholder data
    for sheet_name, headers in other_sheets.items():
        placeholder_row = ["-"] * len(headers)
        add_worksheet(sheet_name, headers, [placeholder_row for _ in range(5)])

    xml_string = ET.tostring(workbook, encoding='utf-8', method='xml').decode()
    xml_header = '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n'
    
    with open("MRF_Tyres_Data_Updated.xls", "w", encoding="utf-8") as f:
        f.write(xml_header + xml_string)

create_excel_xml()
print("Excel file 'MRF_Tyres_Data_Updated.xls' generated successfully!")
