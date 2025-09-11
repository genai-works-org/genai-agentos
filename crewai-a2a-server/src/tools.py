import logging

# Basic logger configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
import requests
import xml.etree.ElementTree as ET

import scholarly
from crewai.tools import tool


@tool("KEGGTool")
def kegg_tool(gene_id: str) -> str:
    """
    Query the KEGG REST API to retrieve pathways related to a gene.

    Args:
        gene_id (str): The gene identifier (e.g., hsa:1234).

    Returns:
        str: The response from KEGG API containing pathway information, or an error message.
    """
    logging.info(f"Invoking kegg_tool with gene_id={gene_id}")
    url = f"https://rest.kegg.jp/link/pathway/{gene_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        logging.info("kegg_tool executed successfully")
        return response.text
    except Exception as e:
        logging.error(f"Error in kegg_tool: {e}")
        return f"Error querying KEGG: {e}"


@tool("ReactomeTool")
def reactome_tool(gene_name: str) -> str:
    """
    Query the Reactome REST API to retrieve pathways related to a gene.

    Args:
        gene_name (str): The gene name or identifier.

    Returns:
        str: The response from Reactome API containing pathway information, or an error message.
    """
    logging.info(f"Invoking reactome_tool with gene_name={gene_name}")
    url = f"https://reactome.org/ContentService/data/query/{gene_name}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        logging.info("reactome_tool executed successfully")
        return response.text
    except Exception as e:
        logging.error(f"Error in reactome_tool: {e}")
        return f"Error querying Reactome: {e}"


# ------------------- Literature Search Tools -------------------


@tool("PubMedTool")
def pubmed_tool(query: str, max_results: int = 5) -> str:
    """
    Search PubMed for scientific articles using the NCBI E-utilities API.

    Args:
        query (str): The search term or query string.
        max_results (int): Maximum number of articles to return (default: 5).

    Returns:
        str: A summary of PubMed search results, or an error message.
    """
    logging.info(
        f"Invoking pubmed_tool with query='{query}', max_results={max_results}"
    )
    # ESearch: get IDs
    esearch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {"db": "pubmed", "term": query, "retmax": max_results, "retmode": "json"}
    try:
        esearch_resp = requests.get(esearch_url, params=params)
        esearch_resp.raise_for_status()
        ids = esearch_resp.json()["esearchresult"].get("idlist", [])
        if not ids:
            logging.info(f"pubmed_tool: No articles found for query: {query}")
            return "No articles found for query: {}".format(query)
        # ESummary: get details
        esummary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        summary_params = {"db": "pubmed", "id": ",".join(ids), "retmode": "json"}
        summary_resp = requests.get(esummary_url, params=summary_params)
        summary_resp.raise_for_status()
        summaries = summary_resp.json()["result"]
        output = []
        for pmid in ids:
            item = summaries.get(pmid, {})
            title = item.get("title", "No title")
            authors = ", ".join([a["name"] for a in item.get("authors", [])])
            journal = item.get("fulljournalname", "")
            year = item.get("pubdate", "")
            output.append(
                f"PMID: {pmid}\nTitle: {title}\nAuthors: {authors}\nJournal: {journal}\nYear: {year}\n---"
            )
        logging.info("pubmed_tool executed successfully")
        return "\n".join(output)
    except Exception as e:
        logging.error(f"Error in pubmed_tool: {e}")
        return f"Error querying PubMed: {e}"


@tool("ArxivTool")
def arxiv_tool(query: str, max_results: int = 5) -> str:
    """
    Search arXiv for scientific articles using the arXiv API.

    Args:
        query (str): The search term or query string.
        max_results (int): Maximum number of articles to return (default: 5).

    Returns:
        str: A summary of arXiv search results, or an error message.
    """
    logging.info(f"Invoking arxiv_tool with query='{query}', max_results={max_results}")
    url = "http://export.arxiv.org/api/query"
    params = {"search_query": query, "start": 0, "max_results": max_results}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = root.findall("atom:entry", ns)
        if not entries:
            logging.info(f"arxiv_tool: No articles found for query: {query}")
            return f"No articles found for query: {query}"
        output = []
        for entry in entries:
            title = entry.find("atom:title", ns).text.strip()
            authors = ", ".join(
                [a.find("atom:name", ns).text for a in entry.findall("atom:author", ns)]
            )
            published = entry.find("atom:published", ns).text[:10]
            link = entry.find("atom:id", ns).text
            output.append(
                f"Title: {title}\nAuthors: {authors}\nPublished: {published}\nLink: {link}\n---"
            )
        logging.info("arxiv_tool executed successfully")
        return "\n".join(output)
    except Exception as e:
        logging.error(f"Error in arxiv_tool: {e}")
        return f"Error querying arXiv: {e}"


@tool("GoogleScholarTool")
def google_scholar_tool(query: str, max_results: int = 5) -> str:
    """
    Search Google Scholar for scientific articles using the scholarly library.
    Note: Google Scholar does not provide an official public API. This tool uses the 'scholarly' Python package.

    Args:
        query (str): The search term or query string.
        max_results (int): Maximum number of articles to return (default: 5).

    Returns:
        str: A summary of Google Scholar search results, or an error message.
    """

    logging.info(
        f"Invoking google_scholar_tool with query='{query}', max_results={max_results}"
    )
    try:
        results = scholarly.search_pubs(query)
        output = []
        for i, pub in enumerate(results):
            if i >= max_results:
                break
            title = getattr(pub, "bib", {}).get("title", "No title")
            author = getattr(pub, "bib", {}).get("author", "")
            year = getattr(pub, "bib", {}).get("pub_year", "")
            venue = getattr(pub, "bib", {}).get("venue", "")
            output.append(
                f"Title: {title}\nAuthors: {author}\nYear: {year}\nVenue: {venue}\n---"
            )
        if not output:
            logging.info(f"google_scholar_tool: No articles found for query: {query}")
            return f"No articles found for query: {query}"
        logging.info("google_scholar_tool executed successfully")
        return "\n".join(output)
    except Exception as e:
        logging.error(f"Error in google_scholar_tool: {e}")
        return f"Error querying Google Scholar: {e}"
