# Action_Tracker: A Chrome extension to track user actions on a webpage, which are stored in JSON format and can be used to train web agents.

## Dataset Summary

This dataset is designed to develop generalist web agents capable of following language instructions to complete complex tasks on any website. Existing datasets for web agents either rely on simulated websites or focus on a limited set of websites and tasks, making them unsuitable for training generalist web agents. Action_Tracker provides three crucial elements for building generalist web agents: 1) a wide range of domains, websites, and tasks, 2) the use of real-world websites rather than simplified or simulated ones, and 3) a comprehensive variety of user interaction patterns.

## Data Fields

- "website" (str): The name of the website where the user interaction was recorded.
- "domain" (str): The primary domain of the website.
- "subdomain" (str): A specific subdomain of the website.
- "confirmed_task" (str): A brief description of the task the user was attempting to complete on the website.
- "action_reprs" (list[str]): A list of human readable descriptions summarizing the sequence of user actions.
- "actions" (list[dict]): A structured list of recorded user interactions, detailing the steps taken to complete the task.
  - "action" (str): A representation of a single user action.
  - "raw_html" (str): The original HTML source code of the webpage before the action took place.
  - "cleaned_html" (str): A sanitized version of the HTML, with unnecessary elements removed.
  - "operation" (dict): Details of the user interaction, specifying what action was performed and its associated metadata.
    - "original_op" (str): The initial recorded operation type, which is mapped to standard actions like click.
    - "value" (str): Any user-provided input value.
    - "op" (str): The final categorized operation type, limited to CLICK, TYPE, or SELECT.
  - "pos_candidate" (dict): The main HTML element that represents the user’s intended interaction.
    - "tag" (str): The HTML tag of the target element.
    - "is_original_target" (bool): Specifies whether the detected element is the highest-level interactive parent element for a given action.
    - "is_top_level_target" (bool): Specifies if the detected target element is the actionable element in the page.
  - "neg_candidates" (list[dict]): A list of other interactive elements on the page that share similar attributes to the identified target, used for comparison.

